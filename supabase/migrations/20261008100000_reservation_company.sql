-- A booking can be invoiced to a company: its name, registration number, legal
-- address and, if it has one, VAT number, as the guest gave them on the form
-- ({ name, regNumber, address, vatNumber? }). The invoice function checks them
-- and puts them on the invoice as its recipient; the booking's name, email and
-- phone stay the contact person's.
--
-- Visitors insert bookings with the anon key, so the column only takes a small
-- object; the function reads nothing from it but those four strings.
alter table public.reservations
  add column if not exists company jsonb
  check (company is null or (jsonb_typeof(company) = 'object' and length(company::text) <= 1000));
