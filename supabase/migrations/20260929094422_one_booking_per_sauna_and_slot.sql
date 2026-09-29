-- One booking per sauna per slot. The booking forms already hide a taken
-- sauna, but a double click, a second tab or two guests choosing the same slot
-- at the same moment all got past that check and booked the sauna twice.
--
-- The 17:00 and 18:00 starts share an evening: the forms treat a sauna booked
-- at either as taken for both, and so does this index.
--
-- Earlier dates are left out because they hold duplicates from before this
-- rule, which are history and not ours to delete.
create unique index if not exists reservations_one_per_sauna_and_slot
  on public.reservations (
    reservation_date,
    (case when reservation_time in ('17:00', '18:00') then 'evening' else reservation_time end),
    sauna_type
  )
  where reservation_date >= date '2026-09-29' and coalesce(sauna_type, '') <> '';
