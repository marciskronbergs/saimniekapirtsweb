-- How the guest pays: 'transfer' (the default, and what every earlier
-- booking was) gets an advance invoice and a final one; 'cash', paid on site
-- after the visit, gets no invoice at all, only a line in the office's list.
alter table public.reservations add column if not exists payment_method text not null default 'transfer';
alter table public.reservations drop constraint if exists reservations_payment_method_check;
alter table public.reservations add constraint reservations_payment_method_check check (payment_method in ('transfer', 'cash'));
