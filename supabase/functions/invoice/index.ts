// Issues invoices for bookings and gift card orders and mails them to the
// office, which checks each one and forwards it to the guest. Nothing here
// ever writes to a guest.
//
// Called by the database, never by browsers:
//   { source_type, source_id }            after a booking or order is saved
//   { sweep: true }                       every 15 minutes, to finish anything
//                                         a failed call left undone
//   { source_type, source_id, dry_run }   draws the invoice without issuing it
//                                         (no number is used) and returns it
// Every call must carry the secret kept in Vault as invoice_hook_secret.
//
// Until RESEND_API_KEY is set the function issues nothing, so no invoice
// numbers are used up before invoices can actually be delivered.

import { createClient } from 'npm:@supabase/supabase-js@2';
import catalog from './priceCatalog.json' with { type: 'json' };
import { priceReservation, priceGiftCard, type PriceCatalog } from './pricing.ts';
import seller from './seller.json' with { type: 'json' };
import { renderInvoicePdf, type InvoiceRow, type InvoiceDetails } from './pdf.ts';
import { invoiceEmail, holdEmail } from './email.ts';

type SourceType = 'reservation' | 'gift_card';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const OFFICE = Deno.env.get('INVOICE_TO') ?? 'info@saimniekapirts.lv';
const FROM = Deno.env.get('INVOICE_FROM') ?? 'Saimnieka pirts <onboarding@resend.dev>';
const VAT_NOTE = 'Nav PVN maksātājs';
const prices = catalog as PriceCatalog;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const rigaToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Riga' });
const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

const toBase64 = (bytes: Uint8Array) => {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
};

// ---------------------------------------------------------------------------
// Reading a booking or an order into one shape.

interface Source {
  type: SourceType;
  id: string;
  locale: 'lv' | 'en';
  name: string;
  email: string;
  phone: string;
  dueOn: string;
  details: InvoiceDetails;
  priced: ReturnType<typeof priceReservation>;
  fields: [string, string][];
}

async function loadSource(type: SourceType, id: string): Promise<Source | null> {
  const today = rigaToday();
  if (type === 'reservation') {
    const { data: r, error } = await db.from('reservations').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!r) return null;
    const date: string = r.reservation_date;
    return {
      type,
      id,
      locale: r.locale === 'en' ? 'en' : 'lv',
      name: r.name ?? '',
      email: r.email ?? '',
      phone: r.phone ?? '',
      // A transfer is due before the visit; a booking picked up late is still
      // never due in the past.
      dueOn: date && date > today ? date : today,
      details: { kind: 'reservation', date, time: r.reservation_time, sauna: r.sauna_type },
      priced: priceReservation(prices, r),
      fields: [
        ['Vārds', r.name ?? ''],
        ['E-pasts', r.email ?? ''],
        ['Tālrunis', r.phone ?? ''],
        ['Datums', `${date} ${r.reservation_time ?? ''}`],
        ['Pirts', r.sauna_type ?? ''],
        ['Veids', r.form_type === 'noma' ? r.rental_type : r.ritual_type],
        ['Personu skaits', r.ritual_participants ? String(r.ritual_participants) : ''],
        ['Nakšņošana', r.overnight_stay ? 'jā' : ''],
        ['Papildus', (r.rental_extras_detail ?? []).map((e: { label: string; quantity: number }) => `${e.label} × ${e.quantity}`).join('; ') ||
          (r.rental_extras ?? []).join('; ')],
      ],
    };
  }
  const { data: g, error } = await db.from('davanu_kartes_pasutijumi').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!g) return null;
  return {
    type,
    id,
    locale: g.locale === 'en' ? 'en' : 'lv',
    name: g.vards_uzvards ?? '',
    email: g.epasts ?? '',
    phone: g.talrunis ?? '',
    dueOn: addDays(today, 7),
    details: { kind: 'gift_card' },
    priced: priceGiftCard(prices, g),
    fields: [
      ['Vārds', g.vards_uzvards ?? ''],
      ['E-pasts', g.epasts ?? ''],
      ['Tālrunis', g.talrunis ?? ''],
      ['Dāvanu karte', g.ritual_type ?? ''],
      ['Vērtība', g.custom_price_value ?? ''],
    ],
  };
}

// ---------------------------------------------------------------------------
// Mail.

async function sendToOffice(
  message: { subject: string; html: string; text: string },
  idempotencyKey: string,
  customerEmail: string,
  attachment?: { filename: string; content: string }
) {
  // The one rule this function exists to keep.
  if (OFFICE.trim().toLowerCase() === customerEmail.trim().toLowerCase()) {
    throw new Error('Refusing to mail a guest directly');
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      // Resend drops a repeat of the same key for a day, so a retry after a
      // lost response cannot deliver the same invoice twice.
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      from: FROM,
      to: [OFFICE],
      subject: message.subject,
      html: message.html,
      text: message.text,
      attachments: attachment ? [attachment] : undefined,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

// Mails an issued invoice unless it has gone out, or another call is sending it.
async function deliver(invoice: InvoiceRow & { emailed_at?: string | null }) {
  if (invoice.emailed_at) return { status: 'already_sent', number: invoice.number };

  const { data: claimed, error } = await db
    .from('invoices')
    .update({ email_attempted_at: new Date().toISOString() })
    .eq('id', invoice.id)
    .is('emailed_at', null)
    .or(`email_attempted_at.is.null,email_attempted_at.lt.${minutesAgo(10)}`)
    .select('id');
  if (error) throw error;
  if (!claimed?.length) return { status: 'in_progress', number: invoice.number };

  const pdf = await renderInvoicePdf(invoice);
  const message = invoiceEmail(invoice);
  await sendToOffice(message, `invoice-${invoice.id}`, invoice.customer_email, {
    filename: message.filename,
    content: toBase64(pdf),
  });
  await db.from('invoices').update({ emailed_at: new Date().toISOString() }).eq('id', invoice.id);
  return { status: 'sent', number: invoice.number };
}

async function notifyHold(type: SourceType, id: string, reason: string, fields: [string, string][], customerEmail: string) {
  await sendToOffice(holdEmail({ sourceType: type, reason, fields }), `hold-${type}-${id}`, customerEmail);
  await db.from('invoice_holds').update({ notified_at: new Date().toISOString() })
    .eq('source_type', type).eq('source_id', id);
}

// ---------------------------------------------------------------------------
// One booking or order.

async function processSource(type: SourceType, id: string) {
  const { data: existing, error: existingError } = await db
    .from('invoices').select('*').eq('source_type', type).eq('source_id', id).maybeSingle();
  if (existingError) throw existingError;
  if (existing) return await deliver(existing);

  const { data: hold } = await db
    .from('invoice_holds').select('notified_at').eq('source_type', type).eq('source_id', id).maybeSingle();
  if (hold) return { status: 'held' };

  const source = await loadSource(type, id);
  if (!source) return { status: 'not_found' };

  const problems = [...source.priced.problems];
  if (source.priced.items.length === 0 && problems.length === 0) problems.push('Nothing to invoice');
  if (!source.email.includes('@')) problems.push('No email address');
  if (!source.name.trim()) problems.push('No name');

  if (problems.length > 0) {
    const reason = problems.join('; ');
    // Only the call that records the hold tells the office about it.
    const { data: inserted, error } = await db
      .from('invoice_holds')
      .upsert({ source_type: type, source_id: id, reason }, { onConflict: 'source_type,source_id', ignoreDuplicates: true })
      .select('source_id');
    if (error) throw error;
    if (inserted?.length) await notifyHold(type, id, reason, source.fields, source.email);
    return { status: 'held', reason };
  }

  const { data: invoice, error } = await db.rpc('create_invoice', {
    p_source_type: type,
    p_source_id: id,
    p_due_on: source.dueOn,
    p_locale: source.locale,
    p_customer_name: source.name.trim(),
    p_customer_email: source.email.trim(),
    p_customer_phone: source.phone.trim() || null,
    p_items: source.priced.items,
    p_total: source.priced.total,
    p_seller: seller,
    p_vat_note: VAT_NOTE,
    p_details: source.details,
  });
  if (error) throw error;
  return await deliver(invoice);
}

// ---------------------------------------------------------------------------
// The 15-minute sweep: bookings from the last day without an invoice, invoices
// not yet mailed, and holds the office has not been told about. It leaves the
// last two minutes alone, which belong to the call each new row makes itself.

async function sweep() {
  const since = minutesAgo(24 * 60);
  const settled = minutesAgo(2);
  const results: unknown[] = [];

  for (const [type, table] of [['reservation', 'reservations'], ['gift_card', 'davanu_kartes_pasutijumi']] as const) {
    const { data: rows, error } = await db
      .from(table).select('id').gte('created_at', since).lt('created_at', settled);
    if (error) throw error;
    const ids = (rows ?? []).map((r) => r.id as string);
    if (ids.length === 0) continue;

    const [{ data: invoiced }, { data: held }] = await Promise.all([
      db.from('invoices').select('source_id').eq('source_type', type).in('source_id', ids),
      db.from('invoice_holds').select('source_id').eq('source_type', type).in('source_id', ids),
    ]);
    const done = new Set([...(invoiced ?? []), ...(held ?? [])].map((r) => r.source_id));
    for (const id of ids.filter((id) => !done.has(id))) {
      results.push({ type, id, ...(await attempt(() => processSource(type, id))) });
    }
  }

  const { data: unsent } = await db
    .from('invoices').select('*').is('emailed_at', null).gte('created_at', minutesAgo(3 * 24 * 60));
  for (const invoice of unsent ?? []) {
    results.push({ number: invoice.number, ...(await attempt(() => deliver(invoice))) });
  }

  const { data: unnotified } = await db
    .from('invoice_holds').select('*').is('notified_at', null)
    .gte('created_at', minutesAgo(3 * 24 * 60)).lt('created_at', minutesAgo(10));
  for (const hold of unnotified ?? []) {
    results.push({
      hold: hold.source_id,
      ...(await attempt(async () => {
        const source = await loadSource(hold.source_type, hold.source_id);
        if (!source) return { status: 'not_found' };
        await notifyHold(hold.source_type, hold.source_id, hold.reason, source.fields, source.email);
        return { status: 'notified' };
      })),
    });
  }
  return { status: 'swept', results };
}

async function attempt<T>(fn: () => Promise<T>) {
  try {
    return await fn();
  } catch (e) {
    console.error(e);
    return { status: 'error', error: e instanceof Error ? e.message : String(e) };
  }
}

// ---------------------------------------------------------------------------

async function preview(type: SourceType, id: string) {
  const source = await loadSource(type, id);
  if (!source) return { status: 'not_found' };
  const invoice: InvoiceRow = {
    id: 'preview',
    number: source.locale === 'en' ? 'PARAUGS / PREVIEW' : 'PARAUGS',
    issued_on: rigaToday(),
    due_on: source.dueOn,
    source_type: type,
    locale: source.locale,
    customer_name: source.name,
    customer_email: source.email,
    customer_phone: source.phone || null,
    items: source.priced.items,
    total: source.priced.total,
    seller: seller as InvoiceRow['seller'],
    vat_note: VAT_NOTE,
    details: source.details,
  };
  const pdf = await renderInvoicePdf(invoice);
  return {
    status: 'preview',
    total: source.priced.total,
    problems: source.priced.problems,
    email: invoiceEmail(invoice),
    pdf_base64: toBase64(pdf),
  };
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  const secret = req.headers.get('x-invoice-secret') ?? '';
  const { data: allowed, error: authError } = secret
    ? await db.rpc('invoice_hook_secret_matches', { p_secret: secret })
    : { data: false, error: null };
  if (authError) return json({ error: 'auth check failed' }, 500);
  if (!allowed) return json({ error: 'forbidden' }, 403);

  const body = await req.json().catch(() => ({}));
  const type = body.source_type as SourceType;
  const validSource = (type === 'reservation' || type === 'gift_card') && typeof body.source_id === 'string';

  try {
    if (body.dry_run) {
      return validSource ? json(await preview(type, body.source_id)) : json({ error: 'source required' }, 400);
    }
    if (!RESEND_API_KEY) return json({ status: 'disabled', reason: 'RESEND_API_KEY is not set' });
    if (body.sweep) return json(await sweep());
    if (validSource) return json(await processSource(type, body.source_id));
    return json({ error: 'nothing to do' }, 400);
  } catch (e) {
    console.error(e);
    return json({ status: 'error', error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
