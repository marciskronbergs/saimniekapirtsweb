-- created_at defaulted to timezone('Europe/Riga', now()): Riga's wall-clock
-- time stored as if it were UTC, two or three hours in the future. The
-- invoice sweep compares it with the real time, so it waited hours before
-- retrying a new booking. The default is now the real time, and existing rows
-- are moved back to the moment they were really made.
alter table public.reservations alter column created_at set default now();
update public.reservations
   set created_at = (created_at at time zone 'UTC') at time zone 'Europe/Riga';
