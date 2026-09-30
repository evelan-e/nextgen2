-- Sets (or replaces) the voice-reset secret for one user and clears their failed attempts.
-- Replace YOUR_EMAIL and YOUR_SECRET, run in the Supabase SQL Editor, then clear the editor.
-- Normalisation must match public.verify_user: lowercase, all whitespace removed.

with target as (
  update auth.users
     set raw_app_meta_data = (coalesce(raw_app_meta_data, '{}'::jsonb)
           || jsonb_build_object('failed_reset_attempts', 0))
           - 'last_failed_at'
   where lower(email) = lower(trim('YOUR_EMAIL'))
  returning id, email
), saved as (
  insert into public.user_secret_words (user_id, secret_word_hash, updated_at)
  select id, extensions.crypt(lower(regexp_replace('YOUR_SECRET', '\s', '', 'g')), extensions.gen_salt('bf', 10)), now()
    from target
  on conflict (user_id) do update
     set secret_word_hash = excluded.secret_word_hash,
         updated_at = excluded.updated_at
  returning user_id
)
select t.id, t.email from target t join saved s on s.user_id = t.id;
