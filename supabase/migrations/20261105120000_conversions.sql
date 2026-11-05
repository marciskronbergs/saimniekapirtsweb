-- Server-side conversions: bookings and payments reported to Meta (Conversions
-- API), Google Analytics 4 (Measurement Protocol) and Google Ads (a scheduled
-- upload of ad clicks), by the `conversions` Edge Function.
--
-- conversion_signals: one row per booking or gift card order, written by the
--   site right after the booking is saved. It holds the guest's marketing
--   consent and, only with that consent, the ad click ids and browser ids. The
--   public may only insert, and only these columns; nothing is read back.
--   It is a table of its own so that no tracking columns are added to
--   reservations or orders.
-- conversion_log: what was sent where, so nothing is sent twice. Server only.
--
-- A cron job calls the function every 10 minutes. The function reads the
-- tables itself with the service role key and takes no input, so calling it
-- needs no secret: an extra call only sends what was due anyway.

create table public.conversion_signals (
  id bigint generated always as identity primary key,
  source_type text not null check (source_type in ('reservation', 'gift_card')),
  source_id uuid not null,
  -- The id the browser's generate_lead event carried, for de-duplication.
  event_id uuid not null,
  marketing boolean not null,
  consent_id uuid,
  gclid text check (length(gclid) <= 500),
  gbraid text check (length(gbraid) <= 500),
  wbraid text check (length(wbraid) <= 500),
  ttclid text check (length(ttclid) <= 500),
  fbc text check (length(fbc) <= 600),
  fbp text check (length(fbp) <= 200),
  ttp text check (length(ttp) <= 200),
  ga_client_id text check (length(ga_client_id) <= 100),
  ga_session_id text check (length(ga_session_id) <= 100),
  page_url text check (length(page_url) <= 500),
  user_agent text check (length(user_agent) <= 500),
  created_at timestamptz not null default now(),
  unique (source_type, source_id),
  -- Without marketing consent only the consent state itself is kept.
  constraint no_tracking_without_consent check (
    marketing or coalesce(gclid, gbraid, wbraid, ttclid, fbc, fbp, ttp,
                          ga_client_id, ga_session_id, page_url, user_agent) is null
  )
);

alter table public.conversion_signals enable row level security;
revoke all on public.conversion_signals from anon, authenticated;
grant insert (source_type, source_id, event_id, marketing, consent_id, gclid, gbraid, wbraid,
              ttclid, fbc, fbp, ttp, ga_client_id, ga_session_id, page_url, user_agent)
  on public.conversion_signals to anon, authenticated;
create policy "Visitors can record how they found the site"
  on public.conversion_signals for insert to anon, authenticated with check (true);

create table public.conversion_log (
  id bigint generated always as identity primary key,
  platform text not null check (platform in ('meta', 'ga4', 'google_ads')),
  kind text not null check (kind in ('lead', 'purchase')),
  -- The booking or gift card order. Never sent anywhere.
  source_type text not null,
  source_id uuid not null,
  event_id text not null,
  value numeric,
  -- sent: accepted by the platform. listed: in the Google Ads upload feed.
  -- skipped: nothing to send (e.g. no click id). failed: see detail.
  status text not null check (status in ('sent', 'listed', 'skipped', 'failed')),
  detail text,
  created_at timestamptz not null default now(),
  unique (platform, kind, source_type, source_id)
);

alter table public.conversion_log enable row level security;
revoke all on public.conversion_log from anon, authenticated;

-- The key in the Google Ads upload address. Made here so nobody has to type
-- one; the office reads the full address from the function's status page.
select vault.create_secret(encode(extensions.gen_random_bytes(24), 'hex'), 'conversions_feed_key');

create or replace function public.conversions_feed_key()
returns text
language sql
security definer
set search_path to ''
as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'conversions_feed_key'
$$;
revoke all on function public.conversions_feed_key() from public, anon, authenticated;
grant execute on function public.conversions_feed_key() to service_role;

create or replace function public.call_conversions_function()
returns void
language plpgsql
security definer
set search_path to ''
as $$
begin
  perform net.http_post(
    url := 'https://wigoyeorqnssgbrgexku.supabase.co/functions/v1/conversions',
    body := '{"run": true}'::jsonb,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    timeout_milliseconds := 30000
  );
exception when others then
  raise warning 'conversions run not requested: %', sqlerrm;
end;
$$;
revoke all on function public.call_conversions_function() from public, anon, authenticated;

select cron.schedule('conversions', '*/10 * * * *', 'select public.call_conversions_function()');
