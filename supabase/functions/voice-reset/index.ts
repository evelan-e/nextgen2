// Voice password reset + ticket self-service (DEMO) - called by Make on behalf of the Retell agent.
//   POST /functions/v1/voice-reset/verify        {email, secret}
//   POST /functions/v1/voice-reset/set_password  {email, secret, new_password}
//   POST /functions/v1/voice-reset/tickets       {action, email, secret, ...}
//        action = list_tickets {query?} | create_ticket {subject, description, customer_name?}
//               | update_ticket_status {ticket_id, new_status} | add_comment {ticket_id, comment}
// Auth: header x-voice-reset-token must equal the VOICE_RESET_TOKEN function secret, and every
// request re-checks email + secret with verify_user. Like the dashboard, a verified caller can
// find and change any ticket.
// The service role key comes from the Edge runtime and never leaves Supabase.
// Never log emails, secrets, passwords or ticket contents.

import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const TOKEN = Deno.env.get("VOICE_RESET_TOKEN") ?? "";

const STATUSES = ["Open", "In Progress", "Waiting on Customer", "Resolved", "Closed"];
const CLOSED = ["Resolved", "Closed"];

type Json = Record<string, unknown>;
type Table = "tickets" | "ticket_history";

function reply(body: Json, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function safeEqual(a: string, b: string) {
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

function str(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function suffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// Escape LIKE wildcards so "first_last@x.com" only matches itself.
function exactIlike(value: string) {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

// Status spoken by the caller -> the app's exact status value.
function normaliseStatus(value: string) {
  const v = value.toLowerCase().replace(/[^a-z]/g, "");
  return STATUSES.find((s) => s.toLowerCase().replace(/[^a-z]/g, "") === v) ??
    (v === "waiting" || v === "waitingoncustomer" ? "Waiting on Customer" : undefined);
}

// "034880", "tkt 034880" or "TKT-034880" -> "TKT-034880".
function normaliseTicketId(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? `TKT-${digits}` : value.toUpperCase();
}

async function findTicket(ticketId: string) {
  for (const table of ["tickets", "ticket_history"] as Table[]) {
    const { data, error } = await supabase.from(table).select("*").eq("id", ticketId).maybeSingle();
    if (error) throw new Error(`${table} lookup failed: ${error.code}`);
    if (data) return { table, row: data };
  }
  return null;
}

// Search all tickets (active + history) by ticket number, subject word or customer name.
// With no query, returns the most recently updated active tickets.
async function listTickets(args: Json) {
  const query = str(args.query).slice(0, 100);
  const columns = "id, subject, status, customer_name, updated_at";
  const digits = query.replace(/\D/g, "");

  const search = (table: Table) => {
    let q = supabase.from(table).select(columns).order("updated_at", { ascending: false }).limit(5);
    if (digits.length >= 3) q = q.ilike("id", `%${digits}%`);
    else if (query) {
      const p = `%${exactIlike(query)}%`;
      q = q.or(`subject.ilike.${JSON.stringify(p)},customer_name.ilike.${JSON.stringify(p)}`);
    }
    return q;
  };

  const [active, history] = await Promise.all([
    search("tickets"),
    query ? search("ticket_history") : Promise.resolve({ data: [], error: null }),
  ]);
  if (active.error || history.error) throw new Error("list failed");
  const tickets = [...(active.data ?? []), ...(history.data ?? [])]
    .slice(0, 5)
    .map(({ id, subject, status, customer_name }) => ({ id, subject, status, customer: customer_name }));
  return reply({ status: "ok", count: tickets.length, tickets });
}

async function customerName(email: string, spoken: string) {
  if (spoken) return spoken.slice(0, 100);
  const pattern = exactIlike(email);
  for (const table of ["tickets", "ticket_history"] as Table[]) {
    const { data } = await supabase.from(table).select("customer_name").ilike("customer_email", pattern)
      .order("updated_at", { ascending: false }).limit(1);
    if (data?.[0]?.customer_name) return data[0].customer_name as string;
  }
  return "";
}

async function createTicket(email: string, args: Json) {
  const subject = str(args.subject).slice(0, 200);
  const description = str(args.description).slice(0, 2000);
  if (!subject) return reply({ status: "invalid", reason: "I need a short description of the problem." });

  const name = await customerName(email, str(args.customer_name));
  if (!name) return reply({ status: "need_name" });

  const now = new Date().toISOString();
  // Same TKT-xxxxxx format as the app; retry on the rare ID collision.
  for (let attempt = 0; attempt < 3; attempt++) {
    const id = `TKT-${String(Date.now() + attempt * 7919).slice(-6)}`;
    const { data: inHistory } = await supabase.from("ticket_history").select("id").eq("id", id).maybeSingle();
    if (inHistory) continue;
    const { error } = await supabase.from("tickets").insert({
      id,
      subject,
      customer_name: name,
      customer_email: email.trim().toLowerCase(),
      priority: "Medium",
      status: "Open",
      assignee: "",
      description,
      created_at: now,
      updated_at: now,
      tags: ["phone"],
      comments: [],
      events: [],
    });
    if (!error) return reply({ status: "created", ticket_id: id });
    if (error.code !== "23505") throw new Error(`insert failed: ${error.code}`);
  }
  throw new Error("could not allocate ticket id");
}

async function updateTicketStatus(args: Json) {
  const ticketId = normaliseTicketId(str(args.ticket_id));
  const newStatus = normaliseStatus(str(args.new_status));
  if (!newStatus) {
    return reply({ status: "invalid", reason: `The status must be one of: ${STATUSES.join(", ")}.` });
  }

  const found = await findTicket(ticketId);
  if (!found) return reply({ status: "not_found" });
  const { table, row } = found;
  if (row.status === newStatus) return reply({ status: "unchanged", ticket_id: ticketId, new_status: newStatus });

  const now = new Date().toISOString();
  const event = { id: `evt-${suffix()}`, field: "status", oldValue: row.status, newValue: newStatus, createdAt: now };
  const events = [...(row.events ?? []), event];
  const assignee = (row.assignee as string) ?? "";

  const reopening = table === "ticket_history" && !CLOSED.includes(newStatus);

  // Record the status-change event like the app does. When reopening, only the event is written
  // here; reopen_ticket copies it across and sets the status on the active ticket.
  const patch = reopening ? { events } : { status: newStatus, events, updated_at: now };
  const { error } = await supabase.from(table).update(patch).eq("id", ticketId);
  if (error) throw new Error(`status update failed: ${error.code}`);

  if (table === "tickets" && CLOSED.includes(newStatus)) {
    // Same as the app: a Resolved/Closed ticket moves into history.
    const { error: moveError } = await supabase.rpc("move_ticket_to_history", {
      p_ticket_id: ticketId,
      p_resolved_at: now,
      p_resolved_by: assignee.trim() || "unassigned",
    });
    if (moveError) throw new Error(`move to history failed: ${moveError.code}`);
  } else if (reopening) {
    // Reopen: reopen_ticket always sets Open, so apply the requested status afterwards.
    const { error: reopenError } = await supabase.rpc("reopen_ticket", {
      p_ticket_id: ticketId,
      p_assignee: assignee,
      p_reason: "",
    });
    if (reopenError) throw new Error(`reopen failed: ${reopenError.code}`);
    if (newStatus !== "Open") {
      const { error: statusError } = await supabase.from("tickets").update({ status: newStatus }).eq("id", ticketId);
      if (statusError) throw new Error(`status after reopen failed: ${statusError.code}`);
    }
  }

  return reply({ status: "updated", ticket_id: ticketId, new_status: newStatus });
}

async function addComment(email: string, args: Json) {
  const ticketId = normaliseTicketId(str(args.ticket_id));
  const body = str(args.comment).slice(0, 2000);
  if (!body) return reply({ status: "invalid", reason: "The comment was empty." });

  const found = await findTicket(ticketId);
  if (!found) return reply({ status: "not_found" });
  const { table, row } = found;

  // Credit the caller, not the ticket's customer: any verified caller can comment on any ticket.
  const author = (await customerName(email, "")) || email.split("@")[0];
  const initials = author.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "C";
  const now = new Date().toISOString();
  const comment = { id: `cmt-${suffix()}`, author, authorInitials: initials, body, type: "public", createdAt: now };

  const { error } = await supabase.from(table)
    .update({ comments: [...(row.comments ?? []), comment], updated_at: now })
    .eq("id", ticketId);
  if (error) throw new Error(`comment failed: ${error.code}`);
  return reply({ status: "added", ticket_id: ticketId });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return reply({ status: "error" }, 405);
  if (!TOKEN || !safeEqual(req.headers.get("x-voice-reset-token") ?? "", TOKEN)) {
    return reply({ status: "error" }, 401);
  }

  const route = new URL(req.url).pathname.split("/").pop();
  if (route !== "verify" && route !== "set_password" && route !== "tickets") return reply({ status: "error" }, 404);

  let body: Json;
  try {
    body = await req.json();
  } catch {
    return reply({ status: "error" }, 400);
  }
  // Accept both Retell shapes: args at root, or {name, args, call}.
  const args = (body?.args ?? body ?? {}) as Json;
  const email = str(args.email);
  const secret = str(args.secret);
  if (!email || !secret) return reply({ status: "not_verified" });

  const { data, error } = await supabase.rpc("verify_user", { p_email: email, p_secret: secret });
  if (error) {
    console.error("verify_user rpc failed", error.code);
    return reply({ status: "error" });
  }
  const status = data?.status === "verified" || data?.status === "locked" ? data.status : "not_verified";

  if (route === "verify" || status !== "verified") return reply({ status });

  if (route === "tickets") {
    try {
      switch (str(args.action)) {
        case "list_tickets": return await listTickets(args);
        case "create_ticket": return await createTicket(email, args);
        case "update_ticket_status": return await updateTicketStatus(args);
        case "add_comment": return await addComment(email, args);
        default: return reply({ status: "error" }, 400);
      }
    } catch (e) {
      console.error("tickets action failed", str(args.action), e instanceof Error ? e.message : "unknown");
      return reply({ status: "error" });
    }
  }

  const newPassword = str(args.new_password);
  if (newPassword.length < 6) {
    return reply({ status: "rejected", reason: "The new password needs at least six characters." });
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(data.user_id, {
    password: newPassword,
  });
  if (updateError) {
    console.error("password update failed", updateError.status, updateError.code);
    const reason =
      updateError.code === "same_password"
        ? "That's the same as your current password. Please choose a different one."
        : updateError.code === "weak_password" || updateError.status === 422
        ? "That password is too weak. Please choose a longer one with letters and numbers."
        : "I couldn't update the password right now. Please try again later.";
    return reply({ status: "rejected", reason });
  }

  return reply({ status: "updated" });
});
