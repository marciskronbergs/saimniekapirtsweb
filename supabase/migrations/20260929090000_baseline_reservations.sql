-- public.reservations was created in the Supabase dashboard, not by a
-- migration, so replaying the migrations on an empty database (a preview
-- branch) failed at the first one that touches it. This recreates the table
-- as it stood before 20260929091851_revoke_public_reservation_write: the
-- columns the booking forms wrote, and the four open "Allow all" policies the
-- following migrations take away.
--
-- Everything happens only when the table is missing. On production it
-- already exists, so this does nothing -- in particular it never brings back
-- the update and delete policies that were revoked there.
do $$
begin
  if to_regclass('public.reservations') is not null then
    return;
  end if;

  create table public.reservations (
    id                  uuid primary key default gen_random_uuid(),
    form_type           text not null check (form_type in ('ritual', 'noma')),
    name                text not null,
    email               text not null,
    phone               text,
    reservation_date    date not null,
    reservation_time    text not null,
    ritual_type         text,
    ritual_participants integer,
    overnight_stay      boolean,
    ritual_message      text,
    sauna_type          text,
    rental_type         text,
    rental_extras       text[],
    rental_message      text,
    -- 20260929202109_reservations_created_at_utc replaces this with now().
    created_at          timestamptz not null default timezone('Europe/Riga', now())
  );

  alter table public.reservations enable row level security;

  create policy "Allow all select" on public.reservations
    for select to public using (true);
  create policy "Allow all insert" on public.reservations
    for insert to public with check (true);
  create policy "Allow all update" on public.reservations
    for update to public using (true) with check (true);
  create policy "Allow all delete" on public.reservations
    for delete to public using (true);

  grant all on public.reservations to anon, authenticated, service_role;
end
$$;
