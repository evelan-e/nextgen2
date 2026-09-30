// Voice password reset (DEMO) - called by Make on behalf of the Retell agent.
//   POST /functions/v1/voice-reset/verify        {email, secret}
//   POST /functions/v1/voice-reset/set_password  {email, secret, new_password}
// Auth: header x-voice-reset-token must equal the VOICE_RESET_TOKEN function secret.
// The service role key comes from the Edge runtime and never leaves Supabase.
// Responses contain only {status[, reason]}; never log emails, secrets or passwords.

import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const TOKEN = Deno.env.get("VOICE_RESET_TOKEN") ?? "";

function reply(body: Record<string, string>, status = 200) {
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
  return typeof v === "string" ? v : "";
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return reply({ status: "error" }, 405);
  if (!TOKEN || !safeEqual(req.headers.get("x-voice-reset-token") ?? "", TOKEN)) {
    return reply({ status: "error" }, 401);
  }

  const action = new URL(req.url).pathname.split("/").pop();
  if (action !== "verify" && action !== "set_password") return reply({ status: "error" }, 404);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return reply({ status: "error" }, 400);
  }
  // Accept both Retell shapes: args at root, or {name, args, call}.
  const args = (body?.args ?? body ?? {}) as Record<string, unknown>;
  const email = str(args.email);
  const secret = str(args.secret);
  if (!email || !secret) return reply({ status: "not_verified" });

  const { data, error } = await supabase.rpc("verify_user", { p_email: email, p_secret: secret });
  if (error) {
    console.error("verify_user rpc failed", error.code);
    return reply({ status: "error" });
  }
  const status = data?.status === "verified" || data?.status === "locked" ? data.status : "not_verified";

  if (action === "verify" || status !== "verified") return reply({ status });

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
