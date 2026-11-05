// Bookings and payments reported to the ad platforms from the server, so they
// count even when a browser blocks the pixels or the guest pays by transfer.
//
// Only for guests who accepted marketing cookies: the site records that choice
// with each booking in `conversion_signals` (src/lib/attribution.ts). What is
// sent: the event, its time and value, the ad click and browser ids from that
// row, and the guest's email and phone hashed with SHA-256. Never the name,
// what was booked, or the booking id (it is the secret in the office's links).
//
//   Lead      a booking or gift card order was saved      Meta
//   Purchase  its first invoice was paid (card or bank)    Meta, GA4
//   both      for guests who came from a Google ad (gclid) Google Ads, through
//             a CSV the account fetches on a schedule (GET ?feed=google_ads)
//
// Meta de-duplicates against the pixel by event_id: the Lead carries the id
// the browser's generate_lead event had, the Purchase "purchase-<hash>" of the
// card payment, as src/lib/analytics.ts trackPaid() does.
//
// Requests:
//   POST {"run": true}            every 10 minutes from pg_cron; sends what is due
//   GET  ?status&key=…            counts of what was sent, and which secrets are set
//   GET  ?feed=google_ads&key=…   the Google Ads upload
// The key is in Vault as conversions_feed_key.
//
// Secrets (Supabase → Edge Functions → Secrets):
//   META_CAPI_TOKEN        Conversions API access token from Meta Events Manager
//   META_TEST_EVENT_CODE   optional: sends to Events Manager's "Test events" tab
//   GA4_API_SECRET         Measurement Protocol API secret from GA4
// Without a secret that platform is left alone and its events wait (up to the
// platforms' limit of 7 days), so setting it later still sends recent ones.

import { createClient } from 'npm:@supabase/supabase-js@2';

const META_PIXEL_ID = Deno.env.get('META_PIXEL_ID') ?? '9129223913845060';
const META_API = Deno.env.get('META_API_VERSION') ?? 'v24.0';
const GA4_MEASUREMENT_ID = Deno.env.get('GA4_MEASUREMENT_ID') ?? 'G-46HJJ959K8';
const SITE = 'https://saimniekapirts.lv';
/** The Google Ads conversion actions the upload reports into. */
const ADS_LEAD = 'Rezervācija (serveris)';
const ADS_PURCHASE = 'Apmaksa (serveris)';

const DAY = 86_400_000;
/** Meta refuses events older than 7 days; a margin for the clock. */
const MAX_AGE = 6.5 * DAY;
/** Lets the site finish writing the booking before it is looked at. */
const SETTLE = 2 * 60_000;
/** Google Ads credits a click for up to 90 days; Meta's longest window is 28. */
const PURCHASE_AGE = 60 * DAY;

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

type SourceType = 'reservation' | 'gift_card';
type Platform = 'meta' | 'ga4' | 'google_ads';
type Kind = 'lead' | 'purchase';

interface Signal {
  source_type: SourceType;
  source_id: string;
  event_id: string;
  marketing: boolean;
  gclid: string | null;
  gbraid: string | null;
  wbraid: string | null;
  fbc: string | null;
  fbp: string | null;
  ga_client_id: string | null;
  ga_session_id: string | null;
  page_url: string | null;
  user_agent: string | null;
  created_at: string;
}

interface Guest {
  email: string | null;
  phone: string | null;
  category: string;
}

// ---------------------------------------------------------------- hashing

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

const normalEmail = (email: string | null) => {
  const e = email?.trim().toLowerCase();
  return e && e.includes('@') ? e : null;
};

/** Digits with the country code, as Meta and Google expect; Latvian numbers get 371. */
function normalPhone(phone: string | null) {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 8 && /^[2-9]/.test(digits)) digits = `371${digits}`;
  return digits.length >= 8 ? digits : null;
}

/** The same id the browser gives a card payment (analytics.ts hashId). */
async function paymentHash(paymentId: string) {
  return (await sha256(paymentId)).slice(0, 24);
}

// ---------------------------------------------------------------- data

async function guestFor(type: SourceType, id: string): Promise<Guest | null> {
  if (type === 'reservation') {
    const { data } = await db.from('reservations').select('email, phone, form_type').eq('id', id).maybeSingle();
    return data ? { email: data.email, phone: data.phone, category: data.form_type === 'noma' ? 'noma' : 'ritual' } : null;
  }
  const { data } = await db.from('davanu_kartes_pasutijumi').select('epasts, talrunis').eq('id', id).maybeSingle();
  return data ? { email: data.epasts, phone: data.talrunis, category: 'gift_card' } : null;
}

async function logged(platform: Platform, kind: Kind, type: SourceType, ids: string[]) {
  if (!ids.length) return new Set<string>();
  const { data, error } = await db
    .from('conversion_log')
    .select('source_id')
    .eq('platform', platform)
    .eq('kind', kind)
    .eq('source_type', type)
    .in('source_id', ids);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.source_id as string));
}

async function log(entry: {
  platform: Platform;
  kind: Kind;
  signal: Signal;
  event_id: string;
  value?: number | null;
  status: 'sent' | 'listed' | 'skipped' | 'failed';
  detail?: string;
}) {
  const { error } = await db.from('conversion_log').upsert(
    {
      platform: entry.platform,
      kind: entry.kind,
      source_type: entry.signal.source_type,
      source_id: entry.signal.source_id,
      event_id: entry.event_id,
      value: entry.value ?? null,
      status: entry.status,
      detail: entry.detail?.slice(0, 1000) ?? null,
    },
    { onConflict: 'platform,kind,source_type,source_id' },
  );
  if (error) console.error('conversion_log', error.message);
}

// ---------------------------------------------------------------- platforms

async function sendMeta(event: Record<string, unknown>) {
  const token = Deno.env.get('META_CAPI_TOKEN');
  if (!token) return null;
  const testCode = Deno.env.get('META_TEST_EVENT_CODE');
  const res = await fetch(`https://graph.facebook.com/${META_API}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: [event], ...(testCode ? { test_event_code: testCode } : {}) }),
  });
  const text = await res.text();
  return { ok: res.ok, detail: `${res.status} ${text}` };
}

async function metaUserData(signal: Signal, guest: Guest) {
  const email = normalEmail(guest.email);
  const phone = normalPhone(guest.phone);
  return {
    ...(email ? { em: [await sha256(email)] } : {}),
    ...(phone ? { ph: [await sha256(phone)] } : {}),
    ...(signal.fbc ? { fbc: signal.fbc } : {}),
    ...(signal.fbp ? { fbp: signal.fbp } : {}),
    ...(signal.user_agent ? { client_user_agent: signal.user_agent } : {}),
  };
}

async function sendGa4(signal: Signal, transactionId: string, value: number) {
  const secret = Deno.env.get('GA4_API_SECRET');
  if (!secret) return null;
  if (!signal.ga_client_id) return { ok: true, skipped: true, detail: 'no GA client id' };
  const sessionId = Number(signal.ga_session_id);
  const res = await fetch(
    `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${encodeURIComponent(secret)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: signal.ga_client_id,
        consent: { ad_user_data: 'GRANTED', ad_personalization: 'GRANTED' },
        events: [
          {
            name: 'purchase',
            params: {
              transaction_id: transactionId,
              value,
              currency: 'EUR',
              booking_type: signal.source_type,
              server_side: 'yes',
              ...(Number.isFinite(sessionId) && sessionId > 0 ? { session_id: sessionId } : {}),
              engagement_time_msec: 1,
            },
          },
        ],
      }),
    },
  );
  // The Measurement Protocol answers 2xx with no body, even for bad events.
  return { ok: res.ok, skipped: false, detail: `${res.status}` };
}

// ---------------------------------------------------------------- run

async function dueSignals(maxAge: number) {
  const since = new Date(Date.now() - maxAge).toISOString();
  const until = new Date(Date.now() - SETTLE).toISOString();
  const { data, error } = await db
    .from('conversion_signals')
    .select('source_type, source_id, event_id, marketing, gclid, gbraid, wbraid, fbc, fbp, ga_client_id, ga_session_id, page_url, user_agent, created_at')
    .eq('marketing', true)
    .gte('created_at', since)
    .lte('created_at', until)
    .order('created_at')
    .limit(500);
  if (error) throw error;
  return (data ?? []) as Signal[];
}

async function notYet(platform: Platform, kind: Kind, signals: Signal[]) {
  const out: Signal[] = [];
  for (const type of ['reservation', 'gift_card'] as const) {
    const ofType = signals.filter((s) => s.source_type === type);
    const done = await logged(platform, kind, type, ofType.map((s) => s.source_id));
    out.push(...ofType.filter((s) => !done.has(s.source_id)));
  }
  return out;
}

/** What was paid, once the first invoice of the booking or order is paid. */
async function payment(signal: Signal) {
  const { data: invoices } = await db
    .from('invoices')
    .select('total, paid, status')
    .eq('source_type', signal.source_type)
    .eq('source_id', signal.source_id)
    .eq('paid', true)
    .neq('status', 'annulled');
  if (!invoices?.length) return null;
  // An advance and the final invoice after it carry the same amount, so the
  // largest is what the guest paid, not the sum.
  const value = Math.max(...invoices.map((i) => Number(i.total) || 0));
  const { data: cards } = await db
    .from('card_payments')
    .select('id, paid_at')
    .eq('source_type', signal.source_type)
    .eq('source_id', signal.source_id)
    .eq('status', 'paid')
    .order('paid_at')
    .limit(1);
  const card = cards?.[0];
  const transactionId = card ? await paymentHash(card.id) : (await sha256(`order:${signal.source_id}`)).slice(0, 24);
  return { value, transactionId, eventId: `purchase-${transactionId}` };
}

async function run() {
  const counts = { lead: 0, purchase: 0, ga4: 0, google_ads: 0, failed: 0 };
  // A lead is reported within Meta's 7 days; a payment may come weeks after the
  // booking, and is reported when it does, as long as the ad click is recent
  // enough for the platforms to credit it.
  const signals = await dueSignals(MAX_AGE);
  const forPurchase = await dueSignals(PURCHASE_AGE);
  const hasMeta = Boolean(Deno.env.get('META_CAPI_TOKEN'));
  const hasGa4 = Boolean(Deno.env.get('GA4_API_SECRET'));
  const guests = new Map<string, Guest | null>();
  const guest = async (s: Signal) => {
    const key = `${s.source_type}:${s.source_id}`;
    if (!guests.has(key)) guests.set(key, await guestFor(s.source_type, s.source_id));
    return guests.get(key)!;
  };

  // Leads to Meta.
  if (hasMeta) {
    for (const s of await notYet('meta', 'lead', signals)) {
      const g = await guest(s);
      if (!g) {
        // Cancelled or never saved: give it an hour, then let it go.
        if (Date.now() - Date.parse(s.created_at) > 60 * 60_000) {
          await log({ platform: 'meta', kind: 'lead', signal: s, event_id: s.event_id, status: 'skipped', detail: 'booking not found' });
        }
        continue;
      }
      const result = await sendMeta({
        event_name: 'Lead',
        event_time: Math.floor(Date.parse(s.created_at) / 1000),
        event_id: s.event_id,
        action_source: 'website',
        event_source_url: s.page_url ?? SITE,
        user_data: await metaUserData(s, g),
        custom_data: { content_category: g.category, currency: 'EUR' },
      });
      if (!result) break;
      await log({ platform: 'meta', kind: 'lead', signal: s, event_id: s.event_id, status: result.ok ? 'sent' : 'failed', detail: result.detail });
      if (result.ok) counts.lead++;
      else counts.failed++;
    }
  }

  // Leads to Google Ads: listed in the upload feed when the guest came from an ad.
  for (const s of await notYet('google_ads', 'lead', signals)) {
    if (!s.gclid) continue;
    if (!(await guest(s))) continue;
    await log({ platform: 'google_ads', kind: 'lead', signal: s, event_id: s.event_id, status: 'listed' });
    counts.google_ads++;
  }

  // Purchases: the first paid invoice of each booking or order.
  for (const platform of ['meta', 'ga4', 'google_ads'] as const) {
    if (platform === 'meta' && !hasMeta) continue;
    if (platform === 'ga4' && !hasGa4) continue;
    for (const s of await notYet(platform, 'purchase', forPurchase)) {
      if (platform === 'google_ads' && !s.gclid) continue;
      const paid = await payment(s);
      if (!paid) continue;
      const g = await guest(s);
      if (!g) continue;

      if (platform === 'google_ads') {
        await log({ platform, kind: 'purchase', signal: s, event_id: paid.eventId, value: paid.value, status: 'listed' });
        counts.google_ads++;
      } else if (platform === 'meta') {
        const result = await sendMeta({
          event_name: 'Purchase',
          event_time: Math.floor(Date.now() / 1000),
          event_id: paid.eventId,
          action_source: 'website',
          event_source_url: s.page_url ?? SITE,
          user_data: await metaUserData(s, g),
          custom_data: { currency: 'EUR', value: paid.value, content_category: g.category },
        });
        if (!result) break;
        await log({ platform, kind: 'purchase', signal: s, event_id: paid.eventId, value: paid.value, status: result.ok ? 'sent' : 'failed', detail: result.detail });
        if (result.ok) counts.purchase++;
        else counts.failed++;
      } else {
        const result = await sendGa4(s, paid.transactionId, paid.value);
        if (!result) break;
        await log({
          platform,
          kind: 'purchase',
          signal: s,
          event_id: paid.transactionId,
          value: paid.value,
          status: result.skipped ? 'skipped' : result.ok ? 'sent' : 'failed',
          detail: result.detail,
        });
        if (result.ok) counts.ga4++;
        else counts.failed++;
      }
    }
  }

  // A failed send is tried again on the next run, up to the age limit.
  await db.from('conversion_log').delete().eq('status', 'failed').lt('created_at', new Date(Date.now() - 60_000).toISOString());
  return counts;
}

// ---------------------------------------------------------------- Google Ads feed

const csvCell = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

/** Google Ads wants "yyyy-MM-dd HH:mm:ss" with an offset; Riga's own, like the account. */
function adsTime(iso: string) {
  const date = new Date(iso);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Riga',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
      timeZoneName: 'longOffset',
    }).formatToParts(date).map((p) => [p.type, p.value]),
  );
  const offset = String(parts.timeZoneName).replace('GMT', '').replace(':', '') || '+0000';
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour === '24' ? '00' : parts.hour}:${parts.minute}:${parts.second}${offset}`;
}

async function googleAdsFeed() {
  const since = new Date(Date.now() - 60 * DAY).toISOString();
  const { data: rows, error } = await db
    .from('conversion_log')
    .select('kind, source_type, source_id, value, created_at')
    .eq('platform', 'google_ads')
    .eq('status', 'listed')
    .gte('created_at', since)
    .order('created_at');
  if (error) throw error;
  const lines = ['Parameters:TimeZone=Europe/Riga', 'Google Click ID,Conversion Name,Conversion Time,Conversion Value,Conversion Currency'];
  for (const row of rows ?? []) {
    const { data: signal } = await db
      .from('conversion_signals')
      .select('gclid, created_at')
      .eq('source_type', row.source_type)
      .eq('source_id', row.source_id)
      .maybeSingle();
    if (!signal?.gclid) continue;
    const isLead = row.kind === 'lead';
    lines.push(
      [
        csvCell(signal.gclid),
        csvCell(isLead ? ADS_LEAD : ADS_PURCHASE),
        adsTime(isLead ? signal.created_at : row.created_at),
        isLead ? '' : String(row.value ?? ''),
        isLead ? '' : 'EUR',
      ].join(','),
    );
  }
  return lines.join('\n') + '\n';
}

// ---------------------------------------------------------------- status

async function status() {
  const since = new Date(Date.now() - 30 * DAY).toISOString();
  const { data: log } = await db.from('conversion_log').select('platform, kind, status').gte('created_at', since);
  const { count: signals } = await db.from('conversion_signals').select('id', { count: 'exact', head: true }).gte('created_at', since);
  const { count: withConsent } = await db
    .from('conversion_signals')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', since)
    .eq('marketing', true);
  const summary: Record<string, number> = {};
  for (const r of log ?? []) {
    const key = `${r.platform} ${r.kind} ${r.status}`;
    summary[key] = (summary[key] ?? 0) + 1;
  }
  return {
    pixel: META_PIXEL_ID,
    meta_check: await metaCheck(),
    last_30_days: { bookings_recorded: signals ?? 0, with_marketing_consent: withConsent ?? 0, ...summary },
    secrets: {
      META_CAPI_TOKEN: Boolean(Deno.env.get('META_CAPI_TOKEN')),
      META_TEST_EVENT_CODE: Boolean(Deno.env.get('META_TEST_EVENT_CODE')),
      GA4_API_SECRET: Boolean(Deno.env.get('GA4_API_SECRET')),
    },
  };
}

/**
 * Checks the token without sending an event: an empty batch gets an auth error
 * for a bad token and "data must be non-empty" for a good one. (A Conversions
 * API token may send events but not read the pixel, so a read is no test.)
 */
async function metaCheck() {
  const token = Deno.env.get('META_CAPI_TOKEN');
  if (!token) return { ok: false, detail: 'no token' };
  const res = await fetch(`https://graph.facebook.com/${META_API}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: [] }),
  });
  const body = await res.json().catch(() => ({}));
  const message: string = body.error?.message ?? '';
  return { ok: /data must be non-empty/i.test(message), detail: message || String(res.status) };
}

async function feedKey() {
  const { data, error } = await db.rpc('conversions_feed_key');
  if (error || !data) throw new Error('feed key missing');
  return String(data);
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  try {
    if (req.method === 'GET' && url.searchParams.get('feed') === 'google_ads') {
      const key = await feedKey();
      if (!safeEqual(url.searchParams.get('key') ?? '', key)) return new Response('Not found', { status: 404 });
      return new Response(await googleAdsFeed(), { headers: { 'Content-Type': 'text/csv; charset=utf-8' } });
    }
    if (req.method === 'GET' && url.searchParams.has('status')) {
      const key = await feedKey();
      if (!safeEqual(url.searchParams.get('key') ?? '', key)) return new Response('Not found', { status: 404 });
      return Response.json(await status());
    }
    if (req.method === 'POST') return Response.json(await run());
    return new Response('Not found', { status: 404 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: String((error as Error).message ?? error) }, { status: 500 });
  }
});
