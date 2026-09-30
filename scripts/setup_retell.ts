// Creates the DEMO voice password-reset agent in Retell (a Retell LLM + an agent using it).
//
//   node --env-file=.env scripts/setup_retell.ts          # dry run: prints the payloads, sends nothing
//   node --env-file=.env scripts/setup_retell.ts --apply  # creates the LLM and agent
//
// Needs in .env: RETELL_API_KEY, MAKE_VERIFY_WEBHOOK_URL, MAKE_SET_PASSWORD_WEBHOOK_URL, VOICE_RESET_TOKEN.
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
const token = need("VOICE_RESET_TOKEN");
const apiKey = apply ? need("RETELL_API_KEY") : process.env.RETELL_API_KEY ?? "";
const voiceId = process.env.RETELL_VOICE_ID?.trim() || "retell-Cimo";

const prompt = `You are a friendly, concise phone assistant for a DEMO password reset service. You only help callers reset their account password. Keep every reply short: one or two sentences.

## Steps
1. Greet the caller and confirm they want to reset their password. If they want something else, say you can only help with password resets and end the call.
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
   - "verified": say they're verified and ask for a new password of at least 6 characters. Spell the new password back letter by letter and ask "Is that correct?". After a clear "yes", call set_new_password with the email, the same secret, and the new password.
   - "not_verified": say you couldn't verify those details, without saying whether the email or the secret was wrong. Allow ONE retry: ask them to repeat the email (spell it back again) and the secret, then call verify_user again. If it fails a second time, apologise, suggest they contact support, and end the call.
   - "locked": say there have been too many attempts, so they need to contact support, and end the call politely.
   - "error", a timeout, or any other result: apologise, say the system is having trouble right now, suggest trying again later or contacting support, and end the call.
6. Handle the set_new_password result:
   - "updated": confirm the password has been changed and they can log in with it now, then end the call. Don't ask if there's anything else; you only handle resets.
   - "rejected": read the "reason" field to the caller, ask for a different new password, spell it back, confirm, and call set_new_password again. Allow this at most twice, then suggest contacting support.
   - "not_verified" or "locked": handle as in step 5.
   - "error", a timeout, or anything else: apologise, say the password was not confirmed as changed, suggest trying again later or contacting support, and end the call.

## Ending the call
Whenever these steps say "end the call", first say a short goodbye (e.g. "Thanks for calling, goodbye."), then call end_call. Also call end_call if the caller says goodbye or asks to hang up, or if there is no response after asking twice.

## Rules
- Never say or spell the secret word.
- Never use placeholder text like "[Company Name]". Refer to this service as "the password reset line".
- Never ask the same question more than twice in a row without explaining what you need.
- Never invent a result. Only say a password was changed after set_new_password returns "updated".
- Do not discuss how the system works internally.`;

const toolHeaders = { "x-voice-reset-token": token };

const llmPayload = {
  model: "gpt-4.1",
  model_temperature: 0,
  start_speaker: "agent",
  begin_message: "Hi, this is the password reset line. Would you like to reset your password?",
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
  ],
};

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
  agent_name: "Voice Password Reset (DEMO)",
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
