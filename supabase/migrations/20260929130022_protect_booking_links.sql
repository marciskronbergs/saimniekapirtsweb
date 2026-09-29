-- A booking's id is now the secret in the office's cancel link, so the public
-- may no longer read ids. The booking form makes the id itself before saving,
-- so it has no need to read it back. Availability still reads date, time and
-- sauna.
--
-- (While the old booking form, which read the id back, was still live, the id
-- was granted again by hand; 20260929131136_hide_booking_ids takes it away
-- once the new form is deployed.)
revoke select on public.reservations from anon, authenticated;
grant select (reservation_date, reservation_time, sauna_type) on public.reservations to anon, authenticated;

-- Wrong PINs are counted. After ten in fifteen minutes the PIN is refused, even
-- when right, until the window passes, so it cannot be guessed by brute force.
create table if not exists public.pin_failures (
  at timestamptz not null default now()
);
alter table public.pin_failures enable row level security;
revoke all on public.pin_failures from anon, authenticated;

create or replace function public.invoice_admin_pin_check(p_pin text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.pin_failures where at < now() - interval '1 day';
  if (select count(*) from public.pin_failures where at > now() - interval '15 minutes') >= 10 then
    return 'locked';
  end if;
  if exists (select 1 from vault.decrypted_secrets where name = 'invoice_admin_pin' and decrypted_secret = p_pin) then
    return 'ok';
  end if;
  insert into public.pin_failures default values;
  return 'wrong';
end;
$$;
revoke execute on function public.invoice_admin_pin_check(text) from public, anon, authenticated;
grant execute on function public.invoice_admin_pin_check(text) to service_role;

notify pgrst, 'reload schema';
