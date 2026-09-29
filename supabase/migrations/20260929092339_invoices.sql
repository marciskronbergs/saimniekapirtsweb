-- Invoices for reservations and gift card orders.
--
-- Three properties matter more than anything else here:
--   * numbers are sequential without gaps within a year, as Latvian invoicing
--     rules expect -- the counter and the invoice are written in one
--     transaction, so a failure never burns a number;
--   * one source (a reservation or a gift card order) gets at most one invoice,
--     so a retried webhook returns the existing invoice instead of billing twice;
--   * nothing here is readable through the public anon key.

-- What the booking forms could not record until now: how many of each extra
-- was ordered, and which language the guest booked in.
alter table public.reservations
  add column if not exists rental_extras_detail jsonb,
  add column if not exists locale text not null default 'lv'
    check (locale in ('lv', 'en'));

alter table public.davanu_kartes_pasutijumi
  add column if not exists locale text not null default 'lv'
    check (locale in ('lv', 'en'));

create table if not exists public.invoice_counters (
  year        int primary key,
  last_number int not null default 0
);

create table if not exists public.invoices (
  id             uuid primary key default gen_random_uuid(),
  number         text not null unique,
  year           int  not null,
  seq            int  not null,
  issued_on      date not null default (timezone('Europe/Riga', now()))::date,
  due_on         date not null,
  source_type    text not null check (source_type in ('reservation', 'gift_card')),
  source_id      uuid not null,
  locale         text not null default 'lv' check (locale in ('lv', 'en')),
  customer_name  text not null,
  customer_email text not null,
  customer_phone text,
  items          jsonb not null,
  total          numeric(10,2) not null check (total >= 0),
  currency       text not null default 'EUR',
  -- Company details as they stood when the invoice was issued, so a later change
  -- of name, address or bank account never rewrites an invoice already sent.
  seller         jsonb not null,
  vat_note       text,
  -- Set when the price could not be verified against the price list. Such an
  -- invoice is held for a person to check instead of being mailed to the guest.
  needs_review   boolean not null default false,
  review_reason  text,
  emailed_at     timestamptz,
  created_at     timestamptz not null default now(),
  unique (year, seq),
  unique (source_type, source_id)
);

alter table public.invoices         enable row level security;
alter table public.invoice_counters enable row level security;
-- No policies on purpose: only the service role, which bypasses row security,
-- may read or write invoices.
revoke all on public.invoices, public.invoice_counters from anon, authenticated;

create or replace function public.create_invoice(
  p_source_type    text,
  p_source_id      uuid,
  p_due_on         date,
  p_locale         text,
  p_customer_name  text,
  p_customer_email text,
  p_customer_phone text,
  p_items          jsonb,
  p_total          numeric,
  p_seller         jsonb,
  p_vat_note       text,
  p_needs_review   boolean default false,
  p_review_reason  text    default null
)
returns public.invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year int := extract(year from timezone('Europe/Riga', now()))::int;
  v_seq  int;
  v_row  public.invoices;
begin
  insert into invoice_counters (year) values (v_year) on conflict (year) do nothing;

  -- Take the year's lock before looking for an existing invoice. Two concurrent
  -- calls for the same booking then run one after the other, and the second
  -- finds the first one's invoice rather than racing it for a number.
  perform 1 from invoice_counters where year = v_year for update;

  select * into v_row
    from invoices
   where source_type = p_source_type and source_id = p_source_id;
  if found then
    return v_row;
  end if;

  update invoice_counters
     set last_number = last_number + 1
   where year = v_year
  returning last_number into v_seq;

  insert into invoices (
    number, year, seq, due_on, source_type, source_id, locale,
    customer_name, customer_email, customer_phone,
    items, total, seller, vat_note, needs_review, review_reason
  ) values (
    format('SP-%s-%s', v_year, lpad(v_seq::text, 4, '0')), v_year, v_seq,
    p_due_on, p_source_type, p_source_id, coalesce(p_locale, 'lv'),
    p_customer_name, p_customer_email, p_customer_phone,
    p_items, p_total, p_seller, p_vat_note, p_needs_review, p_review_reason
  )
  returning * into v_row;

  return v_row;
end;
$$;

revoke execute on function public.create_invoice(
  text, uuid, date, text, text, text, text, jsonb, numeric, jsonb, text, boolean, text
) from public, anon, authenticated;
grant execute on function public.create_invoice(
  text, uuid, date, text, text, text, text, jsonb, numeric, jsonb, text, boolean, text
) to service_role;
