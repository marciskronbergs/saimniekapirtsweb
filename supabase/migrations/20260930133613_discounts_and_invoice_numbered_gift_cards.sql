-- Discounts the office gives from its page (e.g. 50 % for a collaboration),
-- and gift cards numbered by their advance invoice.
--
-- A discount lives in a table of its own, never in reservations or gift card
-- orders: the public key may insert any column of those, and a discount must
-- only ever come from the office. The invoice function reads it when it
-- prices a booking or order and adds it to the invoice as a line of its own.
create table if not exists public.discounts (
  source_type text not null check (source_type in ('reservation', 'gift_card')),
  source_id uuid not null,
  percent numeric(5, 2) not null check (percent > 0 and percent <= 100),
  reason text not null default '',
  created_at timestamptz not null default now(),
  primary key (source_type, source_id)
);
alter table public.discounts enable row level security;
revoke all on public.discounts from anon, authenticated;

-- A discount given after the advance invoice went out replaces that invoice:
-- the old one is annulled and a new one issued. So a booking may now hold an
-- annulled advance invoice beside the one in force; only one may be in force.
alter table public.invoices drop constraint if exists invoices_source_kind_key;
create unique index invoices_source_kind_key
  on public.invoices (source_type, source_id, kind) where status <> 'annulled';

create or replace function public.create_invoice(
  p_kind text, p_source_type text, p_source_id uuid, p_due_on date, p_locale text,
  p_customer_name text, p_customer_email text, p_customer_phone text,
  p_items jsonb, p_total numeric, p_seller jsonb, p_vat_note text,
  p_details jsonb default null, p_paid boolean default false, p_advance_id uuid default null
) returns public.invoices
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_prefix text := case p_kind when 'advance' then 'AR' when 'final' then 'SP' end;
  v_year   int  := extract(year from timezone('Europe/Riga', now()))::int;
  v_seq    int;
  v_row    public.invoices;
begin
  if v_prefix is null then
    raise exception 'unknown invoice kind %', p_kind;
  end if;

  insert into invoice_counters (kind, year) values (v_prefix, v_year) on conflict do nothing;

  -- Take the counter's lock before looking for an existing invoice, so two
  -- calls for the same booking run one after the other and the second finds
  -- the first one's invoice instead of taking another number. An annulled
  -- invoice does not count: the caller decides whether one may be replaced.
  perform 1 from invoice_counters where kind = v_prefix and year = v_year for update;

  select * into v_row from invoices
   where source_type = p_source_type and source_id = p_source_id and kind = p_kind
     and status <> 'annulled';
  if found then
    return v_row;
  end if;

  update invoice_counters set last_number = last_number + 1
   where kind = v_prefix and year = v_year
  returning last_number into v_seq;

  insert into invoices (
    kind, number, year, seq, due_on, source_type, source_id, locale,
    customer_name, customer_email, customer_phone,
    items, total, seller, vat_note, details, paid, advance_id
  ) values (
    p_kind, format('%s-%s-%s', v_prefix, v_year, lpad(v_seq::text, 4, '0')), v_year, v_seq,
    p_due_on, p_source_type, p_source_id, coalesce(p_locale, 'lv'),
    p_customer_name, p_customer_email, p_customer_phone,
    p_items, p_total, p_seller, p_vat_note, p_details, p_paid, p_advance_id
  )
  returning * into v_row;

  return v_row;
end;
$function$;

-- A gift card carries the number of the advance invoice in force for its
-- order, so the card and its payment are matched by one number. There is no
-- card until that invoice exists; if the invoice is replaced (a discount),
-- the card takes the new number.
create or replace function public.gift_card_for(p_order uuid)
returns public.gift_cards
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_row public.gift_cards;
  v_number text;
  v_today date := (timezone('Europe/Riga', now()))::date;
begin
  select number into v_number from public.invoices
   where source_type = 'gift_card' and source_id = p_order and kind = 'advance' and status = 'issued'
   order by created_at desc limit 1;

  select * into v_row from public.gift_cards where order_id = p_order;
  if found then
    if v_number is not null and v_row.code <> v_number then
      update public.gift_cards set code = v_number where order_id = p_order returning * into v_row;
    end if;
    return v_row;
  end if;

  if v_number is null then
    return null;
  end if;
  insert into public.gift_cards (order_id, code, valid_until)
    values (p_order, v_number, (v_today + interval '1 year')::date)
    on conflict (order_id) do nothing;
  select * into v_row from public.gift_cards where order_id = p_order;
  return v_row;
end;
$function$;
revoke all on function public.gift_card_for(uuid) from public, anon, authenticated;
