-- Wires bookings and gift card orders to the invoice Edge Function.
--
-- Every new row asks the function for an invoice, and a job every 15 minutes
-- asks it to pick up anything a failed call left behind. The function mails
-- invoices to the office only; the office forwards them to the guest.
--
-- Invoicing must never cost a booking: the triggers swallow their own errors,
-- and pg_net sends the request after the booking's transaction commits.

create extension if not exists pg_net;
create extension if not exists pg_cron;

-- Bookings the price list could not price. They get no invoice number (a
-- number cannot be taken back) and the office is told to invoice them by hand.
create table if not exists public.invoice_holds (
  source_type text not null check (source_type in ('reservation', 'gift_card')),
  source_id   uuid not null,
  reason      text not null,
  notified_at timestamptz,
  created_at  timestamptz not null default now(),
  primary key (source_type, source_id)
);
alter table public.invoice_holds enable row level security;
revoke all on public.invoice_holds from anon, authenticated;

-- When a send was last tried, so the trigger's call and the retry job cannot
-- both mail the same invoice.
alter table public.invoices
  add column if not exists email_attempted_at timestamptz,
  -- What the invoice is for beyond its lines: the visit's date, time and sauna.
  add column if not exists details jsonb;

-- The shared secret the function checks on every call, so nobody else can make
-- it issue invoices or preview them. Only the service role may test it.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'invoice_hook_secret') then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'invoice_hook_secret',
      'Sent by the database to the invoice Edge Function'
    );
  end if;
end $$;

create or replace function public.invoice_hook_secret_matches(p_secret text)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from vault.decrypted_secrets
     where name = 'invoice_hook_secret' and decrypted_secret = p_secret
  );
$$;
revoke execute on function public.invoice_hook_secret_matches(text) from public, anon, authenticated;
grant execute on function public.invoice_hook_secret_matches(text) to service_role;

-- Posts a request to the function. Used by the triggers and the retry job.
create or replace function public.call_invoice_function(p_body jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret text;
begin
  select decrypted_secret into v_secret
    from vault.decrypted_secrets where name = 'invoice_hook_secret';

  perform net.http_post(
    url := 'https://wigoyeorqnssgbrgexku.supabase.co/functions/v1/invoice',
    body := p_body,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-invoice-secret', v_secret
    ),
    timeout_milliseconds := 30000
  );
exception when others then
  raise warning 'invoice request not sent: %', sqlerrm;
end;
$$;
revoke execute on function public.call_invoice_function(jsonb) from public, anon, authenticated;

create or replace function public.request_invoice()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.call_invoice_function(jsonb_build_object(
    'source_type', tg_argv[0],
    'source_id', new.id
  ));
  return new;
exception when others then
  raise warning 'invoice trigger failed: %', sqlerrm;
  return new;
end;
$$;
revoke execute on function public.request_invoice() from public, anon, authenticated;

drop trigger if exists request_invoice on public.reservations;
create trigger request_invoice
  after insert on public.reservations
  for each row execute function public.request_invoice('reservation');

drop trigger if exists request_invoice on public.davanu_kartes_pasutijumi;
create trigger request_invoice
  after insert on public.davanu_kartes_pasutijumi
  for each row execute function public.request_invoice('gift_card');

select cron.unschedule('invoice-sweep')
 where exists (select 1 from cron.job where jobname = 'invoice-sweep');
select cron.schedule(
  'invoice-sweep',
  '*/15 * * * *',
  $$select public.call_invoice_function('{"sweep": true}'::jsonb)$$
);

-- The visit's details travel with the invoice from the moment it is issued.
drop function if exists public.create_invoice(
  text, uuid, date, text, text, text, text, jsonb, numeric, jsonb, text, boolean, text
);

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
  p_details        jsonb default null
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
    items, total, seller, vat_note, details
  ) values (
    format('SP-%s-%s', v_year, lpad(v_seq::text, 4, '0')), v_year, v_seq,
    p_due_on, p_source_type, p_source_id, coalesce(p_locale, 'lv'),
    p_customer_name, p_customer_email, p_customer_phone,
    p_items, p_total, p_seller, p_vat_note, p_details
  )
  returning * into v_row;

  return v_row;
end;
$$;

revoke execute on function public.create_invoice(
  text, uuid, date, text, text, text, text, jsonb, numeric, jsonb, text, jsonb
) from public, anon, authenticated;
grant execute on function public.create_invoice(
  text, uuid, date, text, text, text, text, jsonb, numeric, jsonb, text, jsonb
) to service_role;
