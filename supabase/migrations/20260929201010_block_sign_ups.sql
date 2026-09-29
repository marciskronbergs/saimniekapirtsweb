-- Nothing on the website or in the office uses Supabase accounts, and the only
-- account ever made was an outsider's probe (an oastify.com address, 5 August
-- 2026), since deleted. Sign-ups are refused in the database itself, so no
-- account can be made through the public key whatever the dashboard's
-- "Allow new users to sign up" setting says. Drop this trigger if accounts
-- are ever wanted.
create or replace function public.refuse_new_accounts()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Sign-ups are closed';
end;
$$;
revoke execute on function public.refuse_new_accounts() from public, anon, authenticated;

drop trigger if exists refuse_new_accounts on auth.users;
create trigger refuse_new_accounts
  before insert on auth.users
  for each row execute function public.refuse_new_accounts();
