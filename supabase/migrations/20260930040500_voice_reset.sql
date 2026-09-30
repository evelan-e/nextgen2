-- Voice password reset (DEMO)
-- Adds public.verify_user(email, secret), callable only with the service_role key.
-- The secret is stored as a bcrypt hash in auth.users.raw_app_meta_data->>'secret_hash'.
-- Failed attempts are tracked in raw_app_meta_data (failed_reset_attempts, last_failed_at).

create extension if not exists pgcrypto with schema extensions;

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
  select u.id, coalesce(u.raw_app_meta_data, '{}'::jsonb)
    into v_user_id, v_meta
    from auth.users u
   where lower(u.email) = lower(trim(p_email))
   for update;

  if v_user_id is null then
    -- Spend roughly the same time as a real bcrypt check so response timing
    -- doesn't reveal whether the email exists.
    perform extensions.crypt('dummy', extensions.gen_salt('bf', 10));
    return jsonb_build_object('status', 'not_verified');
  end if;

  v_hash        := v_meta ->> 'secret_hash';
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
