-- A ritual can be led by more than one sauna master (a large group takes two).
-- The masters assigned to a booking now live in a table of their own, which
-- only the invoice function (service key) reads or writes, instead of the one
-- master_id on reservations. Like a discount, an assignment only ever comes
-- from the office, and the public key may insert any column of reservations.
create table if not exists public.reservation_masters (
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  master_id      uuid not null references public.sauna_masters(id) on delete cascade,
  created_at     timestamptz not null default now(),
  primary key (reservation_id, master_id)
);
create index if not exists reservation_masters_master_idx on public.reservation_masters (master_id);
alter table public.reservation_masters enable row level security;
revoke all on public.reservation_masters from anon, authenticated;

-- The masters assigned so far come along. reservations.master_id is no longer
-- read: whatever a booking form puts there assigns nobody.
insert into public.reservation_masters (reservation_id, master_id)
select id, master_id from public.reservations where master_id is not null
on conflict do nothing;
