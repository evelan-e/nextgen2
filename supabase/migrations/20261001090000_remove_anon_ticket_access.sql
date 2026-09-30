-- The dashboard requires sign-in before it loads any ticket data, so the public anon key
-- needs no access to tickets. Previously anyone with the anon key (shipped in the frontend)
-- could read, create, edit, archive or reopen every ticket.

drop policy if exists "anon can read tickets"   on public.tickets;
drop policy if exists "anon can insert tickets" on public.tickets;
drop policy if exists "anon can update tickets" on public.tickets;
drop policy if exists "anon full access"        on public.ticket_history;

revoke all on table public.tickets        from anon;
revoke all on table public.ticket_history from anon;

revoke execute on function public.move_ticket_to_history(text, timestamptz, text) from public, anon;
revoke execute on function public.reopen_ticket(text, text, text)                  from public, anon;
grant  execute on function public.move_ticket_to_history(text, timestamptz, text) to authenticated, service_role;
grant  execute on function public.reopen_ticket(text, text, text)                  to authenticated, service_role;
