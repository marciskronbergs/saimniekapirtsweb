-- Gift cards used when booking online, and gift card orders the office cancels.
--
-- A card's number is its advance invoice's (AR-2026-0005), so it is easy to
-- guess; a card is therefore used online with its number and a short code
-- printed beside it. Wrong codes are counted, and a card with too many is
-- locked until the office clears it.
create or replace function public.new_gift_card_pin()
returns text
language sql
volatile
set search_path to ''
as $$
  -- Four characters from 32 that cannot be misread (no I, O, 0 or 1).
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + (get_byte(b, i) % 32), 1), '' order by i)
    from (select extensions.gen_random_bytes(4) as b) as r, generate_series(0, 3) as i
$$;
revoke all on function public.new_gift_card_pin() from public, anon, authenticated;

alter table public.gift_cards
  add column if not exists pin text not null default public.new_gift_card_pin(),
  add column if not exists failed_checks integer not null default 0;

-- The card a guest gave on the booking form, with its code. The invoice
-- function checks it and, if it holds, takes it off the booking's invoice.
alter table public.reservations
  add column if not exists gift_card_code text,
  add column if not exists gift_card_pin text;

-- A card taken off a booking: one booking per card. Cancelling the booking
-- frees the card again.
create table if not exists public.gift_card_uses (
  code           text primary key,
  reservation_id uuid not null unique,
  amount         numeric(10, 2) not null,
  created_at     timestamptz not null default now()
);
alter table public.gift_card_uses enable row level security;
revoke all on public.gift_card_uses from anon, authenticated;

-- Gift card orders the office cancelled. Kept apart from the orders, which
-- the public key may insert with any column.
create table if not exists public.gift_card_cancellations (
  order_id     uuid primary key,
  cancelled_at timestamptz not null default now()
);
alter table public.gift_card_cancellations enable row level security;
revoke all on public.gift_card_cancellations from anon, authenticated;

create or replace function public.cancel_reservation(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.reservations;
begin
  delete from public.reservations where id = p_id returning * into v_row;
  if not found then
    return false;
  end if;
  insert into public.cancelled_reservations (id, reservation) values (p_id, to_jsonb(v_row))
    on conflict (id) do nothing;
  -- A gift card the booking used may be used again.
  delete from public.gift_card_uses where reservation_id = p_id;
  return true;
end;
$$;
revoke execute on function public.cancel_reservation(uuid) from public, anon, authenticated;
grant execute on function public.cancel_reservation(uuid) to service_role;

notify pgrst, 'reload schema';
