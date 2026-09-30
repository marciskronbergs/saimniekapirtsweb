-- Paying an invoice by card from a link: the office can send a guest their
-- advance invoice with a link, or show it as a QR code on site. The link
-- carries the invoice's own random pay_token (separate from the office's
-- manage_token), and each Checkout page opened from it is a card_payments
-- row pointing at the invoice.
alter table public.invoices add column if not exists pay_token uuid not null default gen_random_uuid();
alter table public.card_payments add column if not exists invoice_id uuid references public.invoices(id);
create index if not exists card_payments_invoice on public.card_payments (invoice_id);
