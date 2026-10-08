-- Gift card orders can be invoiced to a company too, as bookings can
-- (20261008100000_reservation_company): { name, regNumber, address, vatNumber? }.
alter table public.davanu_kartes_pasutijumi
  add column if not exists company jsonb
  check (company is null or (jsonb_typeof(company) = 'object' and length(company::text) <= 1000));

-- Bookings the office has invoiced as premises rental ("Telpu noma"): the
-- invoice then carries one line for the rental instead of the sauna services,
-- for a company that books the place for an event. Like a discount, this only
-- ever comes from the office, so it lives in a table of its own that the
-- public key cannot touch, never in reservations.
create table if not exists public.premises_rentals (
  source_id uuid primary key,
  created_at timestamptz not null default now()
);
alter table public.premises_rentals enable row level security;
revoke all on public.premises_rentals from anon, authenticated;
