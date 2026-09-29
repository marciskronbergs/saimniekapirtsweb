-- Anyone holding the anon key -- which ships in the site's JavaScript by design --
-- could modify or delete every reservation. Nothing in the site uses either:
-- the booking forms only insert and read availability, and Make receives its
-- data through a webhook rather than by querying this table.
drop policy if exists "Allow all update" on public.reservations;
drop policy if exists "Allow all delete" on public.reservations;
