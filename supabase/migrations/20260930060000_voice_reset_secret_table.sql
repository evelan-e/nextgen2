-- Move the voice-reset secret hash out of raw_app_meta_data (which is copied into every JWT)
-- into public.user_secret_words (RLS on, no policies, no anon/authenticated grants).
-- The failure counter stays in raw_app_meta_data.

insert into public.user_secret_words (user_id, secret_word_hash, updated_at)
select id, raw_app_meta_data ->> 'secret_hash', now()
  from auth.users
 where raw_app_meta_data ? 'secret_hash'
on conflict (user_id) do update
   set secret_word_hash = excluded.secret_word_hash,
       updated_at = excluded.updated_at;

update auth.users
   set raw_app_meta_data = raw_app_meta_data - 'secret_hash'
 where raw_app_meta_data ? 'secret_hash';

create or replace function public.verify_user(p_email text, p_secret text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id     uuid;
  v_meta        jsonb;
  v_hash        text;
  v_failures    int;
  v_last_failed timestamptz;
  v_secret      text;
begin
  if p_email is null or p_secret is null then
    return jsonb_build_object('status', 'not_verified');
  end if;

  -- Lock the row so concurrent calls can't race past the attempt limit.
  select u.id, coalesce(u.raw_app_meta_data, '{}'::jsonb), s.secret_word_hash
    into v_user_id, v_meta, v_hash
    from auth.users u
    left join public.user_secret_words s on s.user_id = u.id
   where lower(u.email) = lower(trim(p_email))
   for update of u;

  if v_user_id is null then
    -- Spend roughly the same time as a real bcrypt check so response timing
    -- doesn't reveal whether the email exists.
    perform extensions.crypt('dummy', extensions.gen_salt('bf', 10));
    return jsonb_build_object('status', 'not_verified');
  end if;

  v_failures    := coalesce((v_meta ->> 'failed_reset_attempts')::int, 0);
  v_last_failed := (v_meta ->> 'last_failed_at')::timestamptz;

  -- Failures older than an hour no longer count.
  if v_last_failed is null or v_last_failed < now() - interval '1 hour' then
    v_failures := 0;
  end if;

  -- Checked before the secret, so a correct secret can't bypass the lock.
  if v_failures >= 3 then
    return jsonb_build_object('status', 'locked');
  end if;

  -- Speech-to-text often inserts spaces ("sunshine 2026"), so strip all whitespace.
  v_secret := lower(regexp_replace(p_secret, '\s', '', 'g'));

  if v_hash is not null and extensions.crypt(v_secret, v_hash) = v_hash then
    update auth.users
       set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
             || jsonb_build_object('failed_reset_attempts', 0, 'last_failed_at', null)
     where id = v_user_id;

    return jsonb_build_object('status', 'verified', 'user_id', v_user_id);
  end if;

  update auth.users
     set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
           || jsonb_build_object('failed_reset_attempts', v_failures + 1, 'last_failed_at', now())
   where id = v_user_id;

  return jsonb_build_object('status', 'not_verified');
end;
$$;

revoke execute on function public.verify_user(text, text) from public, anon, authenticated;
grant execute on function public.verify_user(text, text) to service_role;
