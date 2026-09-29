-- Two kinds of invoice.
--
--   Advance invoice (avansa rēķins, AR-<year>-<nnnn>): issued when a guest books
--   or orders a gift card, mailed to the office, which forwards it. A booking
--   that is cancelled has its advance invoice annulled.
--
--   Invoice (rēķins, SP-<year>-<nnnn>): the accounting document, issued the
--   morning after the visit (or when the office confirms a gift card is paid)
--   and sent to the guest, marked paid. Cancelled bookings never reach this
--   point, so the official numbers run without gaps.
--
-- Each kind has its own counter. The one invoice issued so far under the old
-- single scheme was issued at booking time, so it becomes AR-2026-0001.

alter table public.invoice_counters add column if not exists kind text not null default 'SP';
alter table public.invoice_counters drop constraint if exists invoice_counters_pkey;
alter table public.invoice_counters add primary key (kind, year);

alter table public.invoices
  add column if not exists kind text not null default 'final' check (kind in ('advance', 'final')),
  add column if not exists status text not null default 'issued' check (status in ('issued', 'annulled')),
  add column if not exists annulled_at timestamptz,
  add column if not exists paid boolean not null default false,
  -- The advance invoice a final one settles.
  add column if not exists advance_id uuid references public.invoices (id),
  -- Proves a management link came from the office's email.
  add column if not exists manage_token uuid not null default gen_random_uuid(),
  -- When the final invoice reached the guest, and when a copy reached the
  -- Drive archive and the list (issued, and again if annulled).
  add column if not exists customer_emailed_at timestamptz,
  add column if not exists customer_email_attempted_at timestamptz,
  add column if not exists logged_at timestamptz,
  add column if not exists annul_logged_at timestamptz;

alter table public.invoices drop constraint if exists invoices_year_seq_key;
alter table public.invoices add constraint invoices_kind_year_seq_key unique (kind, year, seq);
alter table public.invoices drop constraint if exists invoices_source_type_source_id_key;
alter table public.invoices add constraint invoices_source_kind_key unique (source_type, source_id, kind);

update public.invoices
   set kind = 'advance',
       number = format('AR-%s-%s', year, lpad(seq::text, 4, '0'))
 where kind = 'final' and number like 'SP-%';
insert into public.invoice_counters (kind, year, last_number)
  select 'AR', year, last_number from public.invoice_counters where kind = 'SP'
  on conflict (kind, year) do update set last_number = excluded.last_number;
update public.invoice_counters set last_number = 0 where kind = 'SP';

drop function if exists public.create_invoice(
  text, uuid, date, text, text, text, text, jsonb, numeric, jsonb, text, jsonb
);

create or replace function public.create_invoice(
  p_kind           text,
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
  p_details        jsonb default null,
  p_paid           boolean default false,
  p_advance_id     uuid default null
)
returns public.invoices
language plpgsql
security definer
set search_path = public
as $$
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
  -- the first one's invoice instead of taking another number.
  perform 1 from invoice_counters where kind = v_prefix and year = v_year for update;

  select * into v_row from invoices
   where source_type = p_source_type and source_id = p_source_id and kind = p_kind;
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
$$;

revoke execute on function public.create_invoice(
  text, text, uuid, date, text, text, text, text, jsonb, numeric, jsonb, text, jsonb, boolean, uuid
) from public, anon, authenticated;
grant execute on function public.create_invoice(
  text, text, uuid, date, text, text, text, text, jsonb, numeric, jsonb, text, jsonb, boolean, uuid
) to service_role;

-- Emails to guests that are not invoices: the booking confirmation.
create table if not exists public.guest_emails (
  source_type  text not null check (source_type in ('reservation', 'gift_card')),
  source_id    uuid not null,
  kind         text not null,
  attempted_at timestamptz,
  sent_at      timestamptz,
  created_at   timestamptz not null default now(),
  primary key (source_type, source_id, kind)
);
alter table public.guest_emails enable row level security;
revoke all on public.guest_emails from anon, authenticated;

-- Switches that are not secrets. Guest confirmations stay off until the office
-- has turned off the confirmations Make sends, so no guest gets two.
create table if not exists public.app_settings (
  key   text primary key,
  value text not null
);
alter table public.app_settings enable row level security;
revoke all on public.app_settings from anon, authenticated;
insert into public.app_settings (key, value) values ('guest_confirmations', 'off')
  on conflict (key) do nothing;

-- The PIN the office types to annul an invoice or issue a final one from the
-- link in its email. The link alone is not enough, because that email is the
-- one forwarded to guests.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'invoice_admin_pin') then
    perform vault.create_secret(
      lpad((floor(random() * 1000000))::int::text, 6, '0'),
      'invoice_admin_pin',
      'Typed by the office on the invoice management page'
    );
  end if;
end $$;

create or replace function public.invoice_admin_pin_matches(p_pin text)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from vault.decrypted_secrets
     where name = 'invoice_admin_pin' and decrypted_secret = p_pin
  );
$$;
revoke execute on function public.invoice_admin_pin_matches(text) from public, anon, authenticated;
grant execute on function public.invoice_admin_pin_matches(text) to service_role;

-- The address of the second Make scenario, which mails guests and files every
-- invoice in Drive and the list. Kept in Vault as guest_make_webhook_url.
create or replace function public.guest_delivery_url()
returns text
language sql
security definer
set search_path = ''
stable
as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'guest_make_webhook_url';
$$;
revoke execute on function public.guest_delivery_url() from public, anon, authenticated;
grant execute on function public.guest_delivery_url() to service_role;

-- Claims for the other two kinds of mail, as claim_invoice_email does for the
-- office copy: one caller at a time, a retry after ten minutes.
create or replace function public.claim_customer_invoice_email(p_invoice_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  with claimed as (
    update public.invoices set customer_email_attempted_at = now()
     where id = p_invoice_id and customer_emailed_at is null
       and (customer_email_attempted_at is null or customer_email_attempted_at < now() - interval '10 minutes')
    returning 1
  )
  select exists (select 1 from claimed);
$$;
revoke execute on function public.claim_customer_invoice_email(uuid) from public, anon, authenticated;
grant execute on function public.claim_customer_invoice_email(uuid) to service_role;

create or replace function public.claim_guest_email(p_source_type text, p_source_id uuid, p_kind text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.guest_emails (source_type, source_id, kind)
    values (p_source_type, p_source_id, p_kind) on conflict do nothing;
  update public.guest_emails set attempted_at = now()
   where source_type = p_source_type and source_id = p_source_id and kind = p_kind
     and sent_at is null
     and (attempted_at is null or attempted_at < now() - interval '10 minutes');
  return found;
end;
$$;
revoke execute on function public.claim_guest_email(text, uuid, text) from public, anon, authenticated;
grant execute on function public.claim_guest_email(text, uuid, text) to service_role;

-- Final invoices go out the morning after the visit, Riga time.
select cron.unschedule('invoice-finals')
 where exists (select 1 from cron.job where jobname = 'invoice-finals');
select cron.schedule(
  'invoice-finals',
  '5 6 * * *',
  $$select public.call_invoice_function('{"finals": true}'::jsonb)$$
);

notify pgrst, 'reload schema';
