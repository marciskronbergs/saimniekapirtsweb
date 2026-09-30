-- The sauna masters who lead rituals. The office assigns them to bookings on
-- its page; each master has a private link (the token) to a page listing the
-- bookings assigned to them. Only the invoice function, with the service key,
-- reads or writes these; the public key sees nothing.
create table if not exists public.sauna_masters (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  phone      text,
  email      text,
  token      uuid not null unique default gen_random_uuid(),
  active     boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.sauna_masters enable row level security;
revoke all on public.sauna_masters from anon, authenticated;

alter table public.reservations
  add column if not exists master_id uuid references public.sauna_masters(id) on delete set null;
-- The booking forms have no business naming a master. (While the public key
-- holds insert on the whole table this changes nothing, but a guessed id
-- could only point at a master, never reveal one.)
revoke insert (master_id) on public.reservations from anon, authenticated;
