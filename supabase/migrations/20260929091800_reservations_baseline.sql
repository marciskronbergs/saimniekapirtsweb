-- The reservations table as it stood before the migrations in this folder
-- began. It was made in the Supabase dashboard, so no migration created it,
-- and a fresh database (a preview branch for a pull request) failed on the
-- very first migration that touches it.
--
-- Everything happens only when the table does not exist yet. On the live
-- database this does nothing at all, which matters: it must never bring back
-- the dashboard's "allow all" update and delete policies that the next
-- migration removes. Columns added later (rental_extras_detail, locale,
-- transport, payment_method, master_id, gift_card_code, gift_card_pin) are
-- left to the migrations that add them.
do $$
begin
  if to_regclass('public.reservations') is not null then
    return;
  end if;

  create table public.reservations (
    id uuid primary key default gen_random_uuid(),
    form_type text not null check (form_type in ('ritual', 'noma')),
    name text not null,
    email text not null,
    phone text,
    reservation_date date not null,
    reservation_time text not null,
    ritual_type text,
    ritual_participants integer,
    overnight_stay boolean,
    ritual_message text,
    sauna_type text,
    rental_type text,
    rental_extras text[],
    rental_message text,
    created_at timestamptz not null default now()
  );

  alter table public.reservations enable row level security;

  -- As the dashboard made them; the migrations that follow remove update and
  -- delete and narrow what the public key may read.
  create policy "Allow all select" on public.reservations for select using (true);
  create policy "Allow all insert" on public.reservations for insert with check (true);
  create policy "Allow all update" on public.reservations for update using (true);
  create policy "Allow all delete" on public.reservations for delete using (true);
end;
$$;
