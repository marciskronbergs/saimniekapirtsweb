-- A booking postponed with no new date yet (a guest falls ill and will call
-- when well). It leaves the reservations, so its time is free again and it is
-- off the calendar, but unlike a cancelled one its advance invoice stays in
-- force: the guest may have paid it. The office gives it a date later, which
-- puts it back among the reservations.
create table if not exists public.postponed_reservations (
  id           uuid primary key,
  reservation  jsonb not null,
  postponed_at timestamptz not null default now()
);
alter table public.postponed_reservations enable row level security;
revoke all on public.postponed_reservations from anon, authenticated;

create or replace function public.postpone_reservation(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.reservations;
begin
  delete from public.reservations where id = p_id returning * into v_row;
  if not found then
    return null;
  end if;
  insert into public.postponed_reservations (id, reservation) values (p_id, to_jsonb(v_row))
    on conflict (id) do update set reservation = excluded.reservation, postponed_at = now();
  return to_jsonb(v_row);
end;
$$;
revoke execute on function public.postpone_reservation(uuid) from public, anon, authenticated;
grant execute on function public.postpone_reservation(uuid) to service_role;

-- Back among the reservations on its new day. The insert runs the invoice
-- trigger as any booking does; the booking keeps its id, so it finds its
-- advance invoice and confirmation already there and issues nothing new.
create or replace function public.restore_reservation(p_id uuid, p_date date, p_time text, p_sauna text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_saved jsonb;
  v_row public.reservations;
begin
  select reservation into v_saved from public.postponed_reservations where id = p_id for update;
  if not found then
    return null;
  end if;
  v_row := jsonb_populate_record(null::public.reservations, v_saved);
  v_row.reservation_date := p_date;
  v_row.reservation_time := p_time;
  v_row.sauna_type := p_sauna;
  insert into public.reservations select v_row.*;
  delete from public.postponed_reservations where id = p_id;
  return to_jsonb(v_row);
end;
$$;
revoke execute on function public.restore_reservation(uuid, date, text, text) from public, anon, authenticated;
grant execute on function public.restore_reservation(uuid, date, text, text) to service_role;

notify pgrst, 'reload schema';
