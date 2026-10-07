-- Russian joins Latvian and English: bookings and gift card orders made on
-- the /ru pages are saved with locale 'ru', and their invoices are issued in
-- Latvian with Russian beside it.

alter table public.reservations drop constraint reservations_locale_check;
alter table public.reservations add constraint reservations_locale_check check (locale in ('lv', 'en', 'ru'));

alter table public.davanu_kartes_pasutijumi drop constraint davanu_kartes_pasutijumi_locale_check;
alter table public.davanu_kartes_pasutijumi add constraint davanu_kartes_pasutijumi_locale_check check (locale in ('lv', 'en', 'ru'));

alter table public.invoices drop constraint invoices_locale_check;
alter table public.invoices add constraint invoices_locale_check check (locale in ('lv', 'en', 'ru'));
