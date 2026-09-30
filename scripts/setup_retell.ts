// Creates the DEMO voice support agent in Retell (a Retell LLM + an agent using it):
// password reset plus ticket lookup / create / status change / notes, all after verification.
//
//   node --env-file=.env scripts/setup_retell.ts          # dry run: prints the payloads, sends nothing
//   node --env-file=.env scripts/setup_retell.ts --apply  # creates the LLM and agent
//
// Needs in .env: RETELL_API_KEY, MAKE_VERIFY_WEBHOOK_URL, MAKE_SET_PASSWORD_WEBHOOK_URL,
// MAKE_TICKETS_WEBHOOK_URL, VOICE_RESET_TOKEN.
// Optional: RETELL_VOICE_ID (default retell-Cimo).
// The service role key is never used here. VOICE_RESET_TOKEN is masked in printed output.

const API = "https://api.retellai.com";
const apply = process.argv.includes("--apply");

function need(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) {
    console.error(`Missing ${name} in .env`);
    process.exit(1);
  }
  return v;
}

const verifyUrl = need("MAKE_VERIFY_WEBHOOK_URL");
const setPasswordUrl = need("MAKE_SET_PASSWORD_WEBHOOK_URL");
const ticketsUrl = need("MAKE_TICKETS_WEBHOOK_URL");
const token = need("VOICE_RESET_TOKEN");
const apiKey = apply ? need("RETELL_API_KEY") : process.env.RETELL_API_KEY ?? "";
const voiceId = process.env.RETELL_VOICE_ID?.trim() || "retell-Cimo";

const prompt = `You are a friendly, concise phone assistant for a DEMO support line. After verifying the caller, you can reset their password or work on support tickets. Keep every reply short: one or two sentences.

## Steps
1. Greet the caller and ask how you can help. If they want something other than a password reset or help with a support ticket, say that's all you can help with and end the call. Either way, you must verify them first (steps 2 to 5).
2. Ask for the email address on their account, and ask them to spell the part before the "@" letter by letter.
   - Build the email from what they say: join spelled letters into one word, turn spoken digits into digits ("one" -> "1"), "at" -> "@", "dot" -> ".", "underscore" -> "_", "dash" or "hyphen" -> "-". Common domains like "gmail dot com" can be taken as spoken.
   - A valid email has exactly one "@" with text before it and a dot somewhere after it. If what you heard doesn't fit that, don't spell it back; say you didn't quite catch it and ask them to spell it again.
   - Spell the whole email back letter by letter, e.g. "a, r, c, a, n, i, n, e, one, at, g, m, a, i, l, dot, com", then ask "Is that right?".
   - Only continue after a clear "yes" to the LATEST spelling. If the caller says "no", "sorry", "wait", or starts correcting you, even right after saying yes, discard the email completely, listen to the correction, and spell the new version back. Never continue with an email the caller has not confirmed.
   - Wait for the caller to finish speaking before you reply. If you were interrupted, don't repeat yourself; respond to what they said.
3. Ask for their secret word. It is usually a word followed by a number, like "sunshine 2026". They may say it or spell it.
   - Build it the same way: join spelled letters, turn spoken digits into digits, lowercase, no spaces (e.g. "s u n s h i n e two zero two six" -> "sunshine2026").
   - NEVER repeat, spell or confirm the secret word aloud. Just say "Thanks."
   - If you genuinely couldn't make it out, ask once: "Sorry, could you spell that letter by letter?" Don't ask for it more than twice in a row; if it's still unclear, call verify_user with your best reading.
4. Call verify_user with the confirmed email and the secret. Call it once per secret the caller gives you.
5. Handle the result:
   - "verified": say they're verified. If they already said what they want, go straight to it; otherwise ask: "Would you like to change your password, or work on a support ticket? I can look up tickets, open a new one, change a ticket's status, or add a note."
     - Password: ask for a new password of at least 6 characters. Spell it back letter by letter and ask "Is that correct?". After a clear "yes", call set_new_password with the email, the same secret, and the new password.
     - Tickets: follow "Tickets" below.
   - "not_verified": say you couldn't verify those details, without saying whether the email or the secret was wrong. Allow ONE retry: ask them to repeat the email (spell it back again) and the secret, then call verify_user again. If it fails a second time, apologise, suggest they contact support, and end the call.
   - "locked": say there have been too many attempts, so they need to contact support, and end the call politely.
   - "error", a timeout, or any other result: apologise, say the system is having trouble right now, suggest trying again later or contacting support, and end the call.
6. Handle the set_new_password result:
   - "updated": confirm the password has been changed and they can log in with it now, then ask if there's anything else.
   - "rejected": read the "reason" field to the caller, ask for a different new password, spell it back, confirm, and call set_new_password again. Allow this at most twice, then suggest contacting support.
   - "not_verified" or "locked": handle as in step 5.
   - "error", a timeout, or anything else: apologise, say the password was not confirmed as changed, suggest trying again later or contacting support, and end the call.

## Tickets (only after verify_user returned "verified")
Always pass the same confirmed email and secret to every ticket function. Don't verify again.
Say ticket numbers digit by digit without the "TKT" prefix, e.g. TKT-034880 -> "ticket zero three four eight eight zero". Callers can say just the digits.
- Find tickets: call list_tickets. Pass "query" with a ticket number, a word from the subject, or a customer name if the caller gave one; leave it empty to get the most recently updated open tickets. Read at most 5 results: number, subject, customer and status. If there are none, say so and offer to search differently.
- Open a new ticket: ask what the problem is. Write a short subject (under 10 words) and a one or two sentence description from their words. Read the subject back and ask "Shall I open that ticket?". After a clear "yes", call create_ticket.
  - "created": read the new ticket number digit by digit.
  - "need_name": ask for their full name, then call create_ticket again with the same details plus customer_name.
- Change a status: the statuses are Open, In Progress, Waiting on Customer, Resolved and Closed. Make sure you know which ticket (look it up with list_tickets if needed), then confirm: "Change ticket <number>, <subject>, to <status>?". After a clear "yes", call update_ticket_status.
  - "updated": confirm the new status. Resolved or Closed tickets move to history; that's normal and they can still be found and reopened.
  - "unchanged": say it already has that status.
- Add a note: make sure you know which ticket, ask what the note should say, read it back, and after a clear "yes" call add_comment. "added": confirm it was added.
- For any ticket function: "not_found" means no ticket has that number, so ask them to check it or offer to search. "invalid": read the "reason" to the caller. "error", a timeout or anything else: apologise, say the change was not confirmed, and suggest trying again later.
- After each task, ask if there's anything else. The caller can do several tasks in one call.

## Ending the call
Whenever these steps say "end the call", first say a short goodbye (e.g. "Thanks for calling, goodbye."), then call end_call. Also call end_call if the caller says goodbye or asks to hang up, or if there is no response after asking twice.

## Rules
- Never say or spell the secret word.
- Never use placeholder text like "[Company Name]". Refer to this service as "the support line".
- Never ask the same question more than twice in a row without explaining what you need.
- Never call a ticket function or set_new_password before verify_user has returned "verified" in this call.
- Never invent a result. Only say something changed after the function returned "updated", "created" or "added".
- Do not discuss how the system works internally.`;

const toolHeaders = { "x-voice-reset-token": token };

const llmPayload = {
  model: "gpt-4.1",
  model_temperature: 0,
  start_speaker: "agent",
  begin_message: "Hi, this is the support line. I can help you reset your password or with a support ticket. What can I do for you?",
  general_prompt: prompt,
  general_tools: [
    {
      type: "end_call",
      name: "end_call",
      description: "End the call once the conversation is finished or the caller must contact support.",
    },
    {
      type: "custom",
      name: "verify_user",
      description:
        "Check the caller's email and secret word. Call only after the caller has confirmed the spelled-back email. Returns {status}: verified, not_verified, locked or error.",
      url: verifyUrl,
      method: "POST",
      headers: toolHeaders,
      args_at_root: true,
      parameters: {
        type: "object",
        properties: {
          email: { type: "string", description: "The confirmed email address, e.g. name@example.com" },
          secret: { type: "string", description: "The caller's secret word, lowercase, no spaces, e.g. sunshine2026" },
        },
        required: ["email", "secret"],
      },
      speak_during_execution: true,
      execution_message_type: "static_text",
      execution_message_description: "One moment while I check that.",
      speak_after_execution: true,
      timeout_ms: 20000,
      max_retry: 0,
    },
    {
      type: "custom",
      name: "set_new_password",
      description:
        "Set the caller's new password. Call only after verify_user returned verified and the caller confirmed the spelled-back new password. Returns {status}: updated, rejected (with reason), not_verified, locked or error.",
      url: setPasswordUrl,
      method: "POST",
      headers: toolHeaders,
      args_at_root: true,
      parameters: {
        type: "object",
        properties: {
          email: { type: "string", description: "The same confirmed email used for verify_user" },
          secret: { type: "string", description: "The same secret word used for verify_user" },
          new_password: { type: "string", description: "The confirmed new password, at least 6 characters" },
        },
        required: ["email", "secret", "new_password"],
      },
      speak_during_execution: true,
      execution_message_type: "static_text",
      execution_message_description: "Updating your password now.",
      speak_after_execution: true,
      timeout_ms: 30000,
      max_retry: 0,
    },
    ticketTool("list_tickets", "Find tickets by ticket number, subject word or customer name, or list the most recently updated open tickets. Returns {status: ok, tickets: [{id, subject, status, customer}]}.", {
      query: { type: "string", description: "Optional: ticket number digits, a word from the subject, or a customer name. Empty for recent open tickets." },
    }, [], "Let me look that up."),
    ticketTool("create_ticket", "Open a new support ticket after the caller confirmed the subject. Returns {status: created, ticket_id} or need_name.", {
      subject: { type: "string", description: "Short summary of the problem, under 10 words" },
      description: { type: "string", description: "One or two sentences describing the problem in the caller's words" },
      customer_name: { type: "string", description: "Only if a previous call returned need_name: the caller's full name" },
    }, ["subject", "description"], "Opening that ticket now."),
    ticketTool("update_ticket_status", "Change a ticket's status after the caller confirmed. Returns {status: updated | unchanged | not_found | invalid}.", {
      ticket_id: { type: "string", description: "Ticket number, e.g. TKT-034880 or just 034880" },
      new_status: { type: "string", enum: ["Open", "In Progress", "Waiting on Customer", "Resolved", "Closed"] },
    }, ["ticket_id", "new_status"], "Updating that ticket now."),
    ticketTool("add_comment", "Add a note to a ticket after the caller confirmed the wording. Returns {status: added | not_found | invalid}.", {
      ticket_id: { type: "string", description: "Ticket number, e.g. TKT-034880 or just 034880" },
      comment: { type: "string", description: "The note, in the caller's words" },
    }, ["ticket_id", "comment"], "Adding that note now."),
  ],
};

// All ticket functions share one Make webhook; the fixed "action" tells the Edge Function what to do.
function ticketTool(
  action: string,
  description: string,
  properties: Record<string, unknown>,
  required: string[],
  message: string,
) {
  return {
    type: "custom",
    name: action,
    description: `${description} Call only after verify_user returned verified in this call.`,
    url: ticketsUrl,
    method: "POST",
    headers: toolHeaders,
    args_at_root: true,
    parameters: {
      type: "object",
      properties: {
        action: { type: "string", enum: [action], description: `Always "${action}"` },
        email: { type: "string", description: "The same confirmed email used for verify_user" },
        secret: { type: "string", description: "The same secret word used for verify_user" },
        ...properties,
      },
      required: ["action", "email", "secret", ...required],
    },
    speak_during_execution: true,
    execution_message_type: "static_text",
    execution_message_description: message,
    speak_after_execution: true,
    timeout_ms: 20000,
    max_retry: 0,
  };
}

function masked(value: unknown) {
  return JSON.stringify(value, null, 2).replaceAll(token, "***VOICE_RESET_TOKEN***");
}

async function retell(path: string, body: unknown) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`${path} failed: HTTP ${res.status}\n${text.replaceAll(token, "***")}`);
    process.exit(1);
  }
  return JSON.parse(text);
}

const agentPayloadPreview = {
  agent_name: "Voice Support Line (DEMO)",
  voice_id: voiceId,
  response_engine: { type: "retell-llm", llm_id: "<llm_id from step 1>" },
  // Callers spell things slowly; a lower value stops the agent being cut off by "um" or noise.
  interruption_sensitivity: 0.6,
  // Helps speech-to-text with email words. Never add secret words here.
  boosted_keywords: ["gmail", "outlook", "hotmail", "yahoo", "icloud", "dot com", "at", "underscore"],
  end_call_after_silence_ms: 30000,
};

console.log("POST /create-retell-llm\n" + masked(llmPayload));
console.log("\nPOST /create-agent\n" + masked(agentPayloadPreview));

if (!apply) {
  console.log("\nDry run only. Re-run with --apply to create the LLM and agent.");
  process.exit(0);
}

const llm = await retell("/create-retell-llm", llmPayload);
console.log(`\nCreated Retell LLM: ${llm.llm_id}`);

const agent = await retell("/create-agent", {
  ...agentPayloadPreview,
  response_engine: { type: "retell-llm", llm_id: llm.llm_id },
});
console.log(`Created agent: ${agent.agent_id}`);
console.log("Add RETELL_AGENT_ID=" + agent.agent_id + " to .env, then open the agent in the Retell dashboard to test.");
