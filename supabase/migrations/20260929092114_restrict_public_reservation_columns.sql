-- The booking calendar needs to know which slots are taken, so visitors must be
-- able to read reservations. It never needs to know who took them. Until now
-- the anon key could read every column, including each guest's name, email,
-- phone and message.
--
-- Row-level security cannot hide columns, so this uses column privileges: the
-- rows stay visible, but only the four columns the site actually reads or
-- filters on. id is included because the ritual form reads it back after
-- inserting, to link the reservation to its invoice.
revoke select on public.reservations from anon, authenticated;
grant select (id, reservation_date, reservation_time, sauna_type)
  on public.reservations to anon, authenticated;
