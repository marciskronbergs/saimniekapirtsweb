-- How the guest gets here, when they ask us: a free pick-up from the
-- "Dzimtmisa" bus stop, or the transfer from Riga and back. Stored as the
-- price list's label, like the other choices; empty when they come on their
-- own. The booking forms write it with the public key, which may insert any
-- column of a new booking but read none of this one.
alter table public.reservations add column if not exists transport text;
