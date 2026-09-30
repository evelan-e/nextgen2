-- A later migration (add_verify_user_rpc) replaced public.verify_user with a version that read
-- public.user_secret_words and had no rate limit. Re-apply 20260930040500_voice_reset.sql's
-- function body (identical, not repeated here) and close the anon-callable secret check.

revoke execute on function public.verify_user_secret_word(text, text) from public, anon, authenticated;
