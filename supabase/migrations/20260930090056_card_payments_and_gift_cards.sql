-- Paying by card through Stripe, for bookings and gift cards, and the gift
-- cards themselves.
--
-- A guest who chooses 'card' is sent to a Stripe Checkout page. Each page
-- opened is a row in card_payments; Stripe tells the invoice function when it
-- is paid (or has expired), and the function asks Stripe again before
-- believing it. If a guest does not pay within the hour, the booking falls
-- back to a bank transfer and gets the usual advance invoice.
--
-- Every gift card order gets a card number when its gift card is first drawn
-- (M-<ddmmyy>-x<nnn>, as on the cards the office made by hand), valid for a
-- year. Only the invoice function, with the service key, reads or writes
-- either table.

alter table public.reservations drop constraint if exists reservations_payment_method_check;
alter table public.reservations add constraint reservations_payment_method_check
  check (payment_method in ('transfer', 'cash', 'card'));

alter table public.davanu_kartes_pasutijumi add column if not exists payment_method text not null default 'transfer';
alter table public.davanu_kartes_pasutijumi drop constraint if exists davanu_kartes_pasutijumi_payment_method_check;
alter table public.davanu_kartes_pasutijumi add constraint davanu_kartes_pasutijumi_payment_method_check
  check (payment_method in ('transfer', 'card'));

create table if not exists public.card_payments (
  id             uuid primary key default gen_random_uuid(),
  source_type    text not null check (source_type in ('reservation', 'gift_card')),
  source_id      uuid not null,
  session_id     text not null unique,
  url            text not null,
  amount         numeric(10, 2) not null,
  status         text not null default 'open' check (status in ('open', 'paid', 'expired')),
  payment_intent text,
  paid_at        timestamptz,
  created_at     timestamptz not null default now()
);
create index if not exists card_payments_source on public.card_payments (source_type, source_id);
alter table public.card_payments enable row level security;
revoke all on public.card_payments from anon, authenticated;

create sequence if not exists public.gift_card_number start 101;
revoke all on sequence public.gift_card_number from anon, authenticated;

create table if not exists public.gift_cards (
  order_id    uuid primary key references public.davanu_kartes_pasutijumi(id) on delete cascade,
  code        text not null unique,
  valid_until date not null,
  created_at  timestamptz not null default now()
);
alter table public.gift_cards enable row level security;
revoke all on public.gift_cards from anon, authenticated;

-- The order's gift card, numbered the first time it is asked for.
create or replace function public.gift_card_for(p_order uuid)
returns public.gift_cards
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_row public.gift_cards;
  v_today date := (timezone('Europe/Riga', now()))::date;
begin
  select * into v_row from public.gift_cards where order_id = p_order;
  if found then
    return v_row;
  end if;
  insert into public.gift_cards (order_id, code, valid_until)
    values (
      p_order,
      format('M-%s-x%s', to_char(v_today, 'DDMMYY'), nextval('public.gift_card_number')),
      (v_today + interval '1 year')::date
    )
    on conflict (order_id) do nothing;
  select * into v_row from public.gift_cards where order_id = p_order;
  return v_row;
end;
$$;
revoke all on function public.gift_card_for(uuid) from public, anon, authenticated;
