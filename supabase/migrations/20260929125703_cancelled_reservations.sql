-- Bookings cancelled from the link in the office's calendar. The booking row
-- is moved here, so its time slot is free again on the website at once, and
-- nothing about it is lost.
create table if not exists public.cancelled_reservations (
  id           uuid primary key,
  reservation  jsonb not null,
  cancelled_at timestamptz not null default now()
);
alter table public.cancelled_reservations enable row level security;
revoke all on public.cancelled_reservations from anon, authenticated;

create or replace function public.cancel_reservation(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.reservations;
begin
  delete from public.reservations where id = p_id returning * into v_row;
  if not found then
    return false;
  end if;
  insert into public.cancelled_reservations (id, reservation) values (p_id, to_jsonb(v_row))
    on conflict (id) do nothing;
  return true;
end;
$$;
revoke execute on function public.cancel_reservation(uuid) from public, anon, authenticated;
grant execute on function public.cancel_reservation(uuid) to service_role;

notify pgrst, 'reload schema';
