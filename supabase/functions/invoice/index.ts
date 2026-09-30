// Invoices and guest mail for bookings and gift card orders.
//
// When a guest books or orders a gift card:
//   * the guest gets a booking confirmation in the language they booked in
//     (while app_settings.guest_confirmations = 'on');
//   * an advance invoice (AR-<year>-<nnnn>) is issued and sent to the guest in
//     a separate email, with a copy to the office through the Make scenario
//     "Rēķini → info@saimniekapirts.lv";
//   * a copy is filed in Google Drive and the invoice list, through the second
//     Make scenario "Klientu e-pasti + rēķinu arhīvs", which also carries every
//     email to guests.
//
// The morning after a visit, unless its advance invoice was annulled, the
// invoice proper (SP-<year>-<nnnn>, marked paid) is issued, sent to the guest
// with thanks and a request for a review, and filed. A gift card's invoice is
// issued when the office confirms payment. Official numbers are therefore only
// used for visits that happened and sales that were paid, and run without gaps.
//
// Called by the database, with the secret kept in Vault as invoice_hook_secret:
//   { source_type, source_id }              after a booking or order is saved
//   { sweep: true }                         every 15 minutes: anything left undone
//   { finals: true }                        every morning: final invoices
//   { source_type, source_id, dry_run }     a preview; no number is used
//   { source_type, source_id, preview_to_office }
//                                           what the guest would get, sent to
//                                           the office instead
// And by the website's page for the office, with a link and the office PIN:
//   { manage: { id, token, pin?, action: 'view' | 'annul' | 'final' } }
//                                           an invoice, from the office's email
//   { manage: { reservation, pin?, action: 'view' | 'cancel' } }
//                                           a booking, from the office's calendar:
//                                           cancelling annuls its advance invoice,
//                                           frees the time slot and asks Make to
//                                           take it off the calendar
//   { office: { pin, action: 'list' | 'assign' | 'save_master' | 'gift_card_pdf'
//               | 'send_invoice' | 'pay_link' } }
//                                           the office's page: upcoming bookings,
//                                           the sauna masters assigned to them, and
//                                           invoices and payment links sent by hand
//   { sauna_master: { token } }             a master's own list, from their link
// And by the booking forms and the /apmaksa page, for paying by card:
//   { payment_options: true }               whether card payments are on
//   { checkout: { type, id } }              a Stripe Checkout page for a booking
//                                           or order the guest chose to pay by card
//   { payment_status | payment_retry | payment_switch | gift_card_pdf: { p } }
//                                           one Checkout payment: how it went, a
//                                           new page, bank transfer instead, and
//                                           the paid gift card as a PDF (a value
//                                           card without its amount with plain: true)
//   { invoice_payment | pay_invoice: { i, t } }
//                                           an invoice's payment link: what it is
//                                           for, and a Checkout page to pay it
// And by Stripe's webhook (checkout.session.* events).

import { createClient } from 'npm:@supabase/supabase-js@2';
import catalog from './priceCatalog.json' with { type: 'json' };
import { priceReservation, priceGiftCard, type PriceCatalog } from './pricing.ts';
import seller from './seller.json' with { type: 'json' };
import { renderInvoicePdf, formatDate, type InvoiceRow, type InvoiceDetails } from './pdf.ts';
import {
  invoiceEmail, holdEmail, confirmationEmail, reminderEmail, advanceInvoiceGuestEmail, finalInvoiceGuestEmail, thanksEmail,
  manageLink,
  type ConfirmationInput,
} from './email.ts';
import { renderGiftCardPdf } from './giftcard.ts';
import type { GiftCardKind } from './giftCardText.ts';
import {
  stripeConfigured, createCheckoutSession, getCheckoutSession, expireCheckoutSession, type CheckoutSession,
} from './stripe.ts';

type SourceType = 'reservation' | 'gift_card';
type Invoice = InvoiceRow & {
  emailed_at?: string | null;
  customer_emailed_at?: string | null;
  logged_at?: string | null;
  annul_logged_at?: string | null;
  manage_token: string;
  pay_token?: string;
  advance_id?: string | null;
  source_id: string;
};

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});
const VAT_NOTE = 'Nav PVN maksātājs';
const prices = catalog as PriceCatalog;
const typedSeller = seller as InvoiceRow['seller'];

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...cors } });

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

// Database errors arrive as plain objects, not Error instances.
const describe = (e: unknown) =>
  e instanceof Error ? e.message : (e as { message?: string })?.message ?? String(e);

async function attempt<T>(fn: () => Promise<T>) {
  try {
    return await fn();
  } catch (e) {
    console.error(e);
    return { status: 'error', error: describe(e) };
  }
}

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
  // deno-lint-ignore no-explicit-any
  row: any;
  // Set once a card payment for it is known to have gone through.
  cardPaid?: boolean;
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
      row: r,
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
        ['Transports', r.transport ?? ''],
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
    row: g,
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
// Where mail goes. Both Make webhook addresses live in Vault; while one is
// absent, the work that needs it waits and the sweep picks it up later.

async function rpcText(name: string): Promise<string | null> {
  const { data, error } = await db.rpc(name);
  if (error) throw error;
  return data || null;
}
const officeUrl = () => rpcText('invoice_delivery_url');
const guestUrl = () => rpcText('guest_delivery_url');

async function setting(key: string): Promise<string | null> {
  const { data, error } = await db.from('app_settings').select('value').eq('key', key).maybeSingle();
  if (error) throw error;
  return data?.value ?? null;
}

async function post(url: string | null, what: string, payload: Record<string, unknown>) {
  if (!url) throw new Error(`${what} is not switched on`);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Make ${res.status}: ${await res.text()}`);
}

// To the office only: the recipient is fixed in that scenario.
async function sendToOffice(
  message: { subject: string; html: string; text: string },
  attachment?: { filename: string; content: string }
) {
  await post(await officeUrl(), 'Office mail', {
    subject: message.subject,
    html: message.html,
    text: message.text,
    ...(attachment ? { filename: attachment.filename, pdf_base64: attachment.content } : {}),
  });
}

// To a guest, through the second scenario, with up to three attachments: an
// invoice, then a gift card (filename2 / pdf2_base64) and the value card's
// version without its amount (filename3 / pdf3_base64). The scenario has a
// route for each count.
type Attachment = { filename: string; content: string };
async function sendToGuest(to: string, message: { subject: string; html: string }, attachments: Attachment[] = []) {
  const [first, second, third] = attachments;
  await post(await guestUrl(), 'Guest mail', {
    route: 'email',
    to,
    subject: message.subject,
    html: message.html,
    ...(first ? { filename: first.filename, pdf_base64: first.content } : {}),
    ...(first && second ? { filename2: second.filename, pdf2_base64: second.content } : {}),
    ...(first && second && third ? { filename3: third.filename, pdf3_base64: third.content } : {}),
  });
}

// ---------------------------------------------------------------------------
// Advance invoices: to the guest, and a copy to the office.

async function deliverAdvance(invoice: Invoice) {
  if (invoice.emailed_at) return { status: 'already_sent', number: invoice.number };
  const { data: claimed, error } = await db.rpc('claim_invoice_email', { p_invoice_id: invoice.id });
  if (error) throw error;
  if (!claimed) return { status: 'in_progress', number: invoice.number };

  const pdf = await renderInvoicePdf(invoice);
  const message = invoiceEmail(invoice);
  await sendToOffice(message, { filename: message.filename, content: toBase64(pdf) });
  await db.from('invoices').update({ emailed_at: new Date().toISOString() }).eq('id', invoice.id);
  return { status: 'sent', number: invoice.number };
}

// The guest's own email with the advance invoice, sent once, after the
// confirmation. It waits while the guest scenario is not set up.
async function deliverAdvanceToGuest(invoice: Invoice) {
  if (invoice.customer_emailed_at) return { status: 'already_sent' };
  if (invoice.status !== 'issued') return { status: 'annulled' };
  if (invoice.source_type === 'gift_card' && invoice.details?.payment === 'card') {
    // Paid at once: the guest gets the final invoice, with the gift card, instead.
    await db.from('invoices').update({ customer_emailed_at: new Date().toISOString() }).eq('id', invoice.id);
    return { status: 'not_needed' };
  }
  if (!(await guestUrl())) return { status: 'guest_mail_off' };
  const { data: claimed, error } = await db.rpc('claim_customer_invoice_email', { p_invoice_id: invoice.id });
  if (error) throw error;
  if (!claimed) return { status: 'in_progress' };

  const pdf = await renderInvoicePdf(invoice);
  const message = advanceInvoiceGuestEmail(invoice);
  await sendToGuest(invoice.customer_email, message, [{ filename: message.filename, content: toBase64(pdf) }]);
  await db.from('invoices').update({ customer_emailed_at: new Date().toISOString() }).eq('id', invoice.id);
  return { status: 'sent_to_guest' };
}

async function notifyHold(type: SourceType, id: string, reason: string, fields: [string, string][]) {
  await sendToOffice(holdEmail({ sourceType: type, reason, fields }));
  await db.from('invoice_holds').update({ notified_at: new Date().toISOString() })
    .eq('source_type', type).eq('source_id', id);
}

// ---------------------------------------------------------------------------
// The archive: every invoice as a PDF in Drive and a line in the list, and an
// annulled one again, stamped, when it is annulled.

const bookingLink = (id: string) => `https://saimniekapirts.lv/rekins?r=${id}`;

// The link in a row's "Atcelšanas links" column. It also finds the row again
// when the booking is cancelled or the invoice annulled.
const cancelLink = (invoice: Invoice) =>
  invoice.source_type === 'reservation' ? bookingLink(invoice.source_id) : manageLink(invoice);

const visitText = (d: InvoiceDetails | null | undefined) =>
  d?.kind === 'reservation' && d.date ? `${formatDate(d.date)} ${d.time ?? ''} ${d.sauna ?? ''}`.trim() : 'Dāvanu karte';

async function archive(invoice: Invoice) {
  const annulled = invoice.status === 'annulled';
  if (annulled ? invoice.annul_logged_at : invoice.logged_at) return { status: 'already_filed' };
  const url = await guestUrl();
  if (!url) return { status: 'archive_off' };

  const pdf = await renderInvoicePdf(invoice);
  if (annulled) {
    // The stamped PDF goes to Drive, and the row filed when the invoice was
    // issued is updated rather than a second row added. A booking that has
    // been cancelled is no longer among the bookings.
    let bookingStatus = '';
    if (invoice.source_type === 'reservation') {
      const { data: booking } = await db.from('reservations').select('id').eq('id', invoice.source_id).maybeSingle();
      if (!booking) bookingStatus = 'Atcelta';
    }
    await post(url, 'Archive', {
      route: 'update',
      key: cancelLink(invoice),
      filename: `${invoice.number}-ANULETS.pdf`,
      pdf_base64: toBase64(pdf),
      status: 'Anulēts',
      booking_status: bookingStatus,
    });
  } else {
    await post(url, 'Archive', {
      route: 'archive',
      filename: `${invoice.number}.pdf`,
      pdf_base64: toBase64(pdf),
      date: formatDate(invoice.issued_on),
      number: invoice.number,
      kind: invoice.kind === 'final' ? 'Rēķins' : 'Avansa rēķins',
      status: invoice.kind === 'final' || invoice.details?.payment === 'card' ? 'Apmaksāts' : 'Izrakstīts',
      customer: invoice.customer_name,
      email: invoice.customer_email,
      visit: visitText(invoice.details),
      total: Number(invoice.total).toFixed(2).replace('.', ','),
      // Cancels the booking (and annuls this invoice), or for a gift card
      // annuls the invoice. Only the advance invoice's row carries it.
      cancel_url: invoice.kind === 'advance' ? cancelLink(invoice) : '',
      payment: invoice.details?.payment === 'card' ? 'Karte (Stripe)' : 'Pārskaitījums',
      booking_status: invoice.kind === 'advance' && invoice.source_type === 'reservation' ? 'Aktīva' : '',
    });
  }
  await db.from('invoices')
    .update(annulled ? { annul_logged_at: new Date().toISOString() } : { logged_at: new Date().toISOString() })
    .eq('id', invoice.id);
  return { status: 'filed' };
}

// A booking paid in cash on site gets no invoice, but a row in the list all
// the same, so the office can see every booking in one place.
async function logCashBooking(source: Source) {
  const url = await guestUrl();
  if (!url) return { status: 'archive_off' };
  const { data: claimed, error } = await db.rpc('claim_guest_email', {
    p_source_type: 'reservation', p_source_id: source.id, p_kind: 'sheet_row',
  });
  if (error) throw error;
  if (!claimed) return { status: 'already_listed' };
  await post(url, 'List', {
    route: 'log',
    date: formatDate(rigaToday()),
    number: '',
    kind: 'Rezervācija bez rēķina',
    status: 'Bez rēķina',
    customer: source.name,
    email: source.email,
    visit: visitText(source.details),
    total: source.priced.problems.length ? '' : Number(source.priced.total).toFixed(2).replace('.', ','),
    cancel_url: bookingLink(source.id),
    payment: 'Skaidrā naudā uz vietas',
    booking_status: 'Aktīva',
  });
  await db.from('guest_emails').update({ sent_at: new Date().toISOString() })
    .eq('source_type', 'reservation').eq('source_id', source.id).eq('kind', 'sheet_row');
  return { status: 'listed' };
}

// A cancelled booking's row in the list, when there is no invoice to annul.
async function markCancelledInList(id: string) {
  const url = await guestUrl();
  if (!url) return { status: 'archive_off' };
  await post(url, 'List', { route: 'update', key: bookingLink(id), status: '', booking_status: 'Atcelta' });
  return { status: 'marked' };
}

const paysCash = (source: Source) => source.type === 'reservation' && source.row.payment_method === 'cash';

// ---------------------------------------------------------------------------
// Guest booking confirmation.

// The transport a guest chose, in their language, with "free" for the pick-up.
function transportName(label: string | null | undefined, locale: 'lv' | 'en') {
  const option = prices.transport.find((x) => x.label === label);
  if (!option) return '';
  const name = locale === 'lv' ? option.lv : option.en;
  if (option.custom) return `${name} (${locale === 'lv' ? 'cena pēc vienošanās' : 'price by agreement'})`;
  return option.price > 0 ? name : `${name} (${locale === 'lv' ? 'bez maksas' : 'free'})`;
}

function guestInput(source: Source): ConfirmationInput {
  const r = source.row;
  const ritual = prices.ritual.find((x) => x.label === r.ritual_type);
  return {
    type: source.type,
    locale: source.locale,
    name: source.name,
    formType: r.form_type,
    date: source.details.date,
    time: source.details.time,
    sauna: source.details.sauna,
    participants: r.ritual_participants ?? null,
    overnight: !!r.overnight_stay || (r.rental_extras ?? []).some((e: string) => e.startsWith('Nakšņošana')),
    giftLabel: source.type === 'gift_card' ? r.ritual_type ?? '' : undefined,
    transport: transportName(r.transport, source.locale),
    cash: r.payment_method === 'cash',
    card: !!source.cardPaid,
    priced: source.priced,
    individual: ritual?.people === 1,
    seller: typedSeller,
  };
}
const confirmationFor = (source: Source) => confirmationEmail(guestInput(source));

// The reminder the day before a visit, sent from 10:00 Riga time by the
// sweep, so a failed send is tried again a quarter of an hour later. A
// booking made in the last 18 hours has just had its confirmation and gets
// no reminder.
const REMINDER_HOUR = 10;
async function reminders() {
  if ((await setting('guest_confirmations')) !== 'on') return { status: 'confirmations_off' };
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Riga', hour: 'numeric', hourCycle: 'h23' })
    .formatToParts(new Date()).find((part) => part.type === 'hour')?.value ?? 0);
  if (hour < REMINDER_HOUR) return { status: 'too_early' };
  if (!(await guestUrl())) return { status: 'guest_mail_off' };

  const { data: rows, error } = await db.from('reservations').select('id')
    .eq('reservation_date', addDays(rigaToday(), 1)).lt('created_at', minutesAgo(18 * 60));
  if (error) throw error;
  const ids = (rows ?? []).map((r) => r.id as string);
  if (ids.length === 0) return { status: 'none' };
  const { data: done } = await db.from('guest_emails').select('source_id')
    .eq('source_type', 'reservation').eq('kind', 'reminder').not('sent_at', 'is', null).in('source_id', ids);
  const sent = new Set((done ?? []).map((r) => r.source_id));

  const results: unknown[] = [];
  for (const id of ids.filter((i) => !sent.has(i))) {
    results.push({
      reminder: id,
      ...(await attempt(async () => {
        const source = await loadSource('reservation', id);
        if (!source) return { status: 'not_found' };
        if (!source.email.includes('@')) return { status: 'no_email' };
        source.cardPaid = await hasCardPayment(source);
        const { data: claimed, error: claimError } = await db.rpc('claim_guest_email', {
          p_source_type: 'reservation', p_source_id: id, p_kind: 'reminder',
        });
        if (claimError) throw claimError;
        if (!claimed) return { status: 'in_progress' };
        await sendToGuest(source.email, reminderEmail(guestInput(source)));
        await db.from('guest_emails').update({ sent_at: new Date().toISOString() })
          .eq('source_type', 'reservation').eq('source_id', id).eq('kind', 'reminder');
        return { status: 'reminded' };
      })),
    });
  }
  return { status: 'reminders', results };
}

async function confirmGuest(source: Source) {
  if ((await setting('guest_confirmations')) !== 'on') return { status: 'confirmations_off' };
  if (!source.email.includes('@')) return { status: 'no_email' };
  const { data: claimed, error } = await db.rpc('claim_guest_email', {
    p_source_type: source.type, p_source_id: source.id, p_kind: 'confirmation',
  });
  if (error) throw error;
  if (!claimed) return { status: 'already_sent' };

  // A gift card paid by card goes to the guest at once, with its invoice; an
  // order confirmation saying it will follow would only confuse.
  if (!(source.type === 'gift_card' && source.cardPaid)) await sendToGuest(source.email, confirmationFor(source));
  await db.from('guest_emails').update({ sent_at: new Date().toISOString() })
    .eq('source_type', source.type).eq('source_id', source.id).eq('kind', 'confirmation');
  return { status: 'confirmed' };
}

// ---------------------------------------------------------------------------
// One booking or order, when it is saved (and again from the sweep).

async function processSource(type: SourceType, id: string) {
  const source = await loadSource(type, id);
  if (!source) return { status: 'not_found' };
  return await processLoaded(source);
}

async function processLoaded(source: Source) {
  const card = await cardState(source);
  if (card === 'awaiting') return { status: 'awaiting_payment' };
  if (card === 'paid') return await paidByCard(source);
  // The guest's confirmation does not wait on, or fail with, the invoice.
  const confirmation = await attempt(() => confirmGuest(source));
  const advance = paysCash(source)
    ? await attempt(() => logCashBooking(source))
    : await attempt(() => issueAdvance(source));
  return { advance, confirmation };
}

// Paid by card, the advance invoice says so and asks for nothing.
async function issueAdvance(source: Source, paidOn?: string) {
  const made = await createAdvance(source, paidOn);
  if (!made.invoice) return { status: 'held', ...(made.reason ? { reason: made.reason } : {}) };
  const invoice = made.invoice;
  const guest = await attempt(() => deliverAdvanceToGuest(invoice));
  const sent = await deliverAdvance(invoice);
  const filed = await attempt(() => archive(invoice));
  return { ...sent, guest, filed };
}

// The booking's or order's advance invoice: the one already issued, or a new
// one. One that cannot be priced is held for the office instead.
async function createAdvance(source: Source, paidOn?: string): Promise<{ invoice?: Invoice; reason?: string }> {
  const { type, id } = source;
  const { data: existing, error: existingError } = await db
    .from('invoices').select('*').eq('source_type', type).eq('source_id', id).eq('kind', 'advance').maybeSingle();
  if (existingError) throw existingError;
  if (existing) return { invoice: existing };

  const { data: hold } = await db
    .from('invoice_holds').select('reason').eq('source_type', type).eq('source_id', id).maybeSingle();
  if (hold) return { reason: hold.reason };

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
    if (inserted?.length) await notifyHold(type, id, reason, source.fields);
    return { reason };
  }

  const { data: invoice, error } = await db.rpc('create_invoice', {
    p_kind: 'advance',
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
    p_details: paidOn ? { ...source.details, payment: 'card', paid_on: paidOn } : source.details,
    p_paid: !!paidOn,
  });
  if (error) throw error;
  return { invoice };
}

// ---------------------------------------------------------------------------
// Final invoices.

// Issues the invoice that settles an advance, unless the advance was annulled.
// The lines and the seller are the advance's, word for word.
async function issueFinal(advance: Invoice) {
  if (advance.kind !== 'advance') throw new Error('Not an advance invoice');
  if (advance.status === 'annulled') return { status: 'annulled' };
  const { data: invoice, error } = await db.rpc('create_invoice', {
    p_kind: 'final',
    p_source_type: advance.source_type,
    p_source_id: advance.source_id,
    p_due_on: rigaToday(),
    p_locale: advance.locale,
    p_customer_name: advance.customer_name,
    p_customer_email: advance.customer_email,
    p_customer_phone: advance.customer_phone,
    p_items: advance.items,
    p_total: advance.total,
    p_seller: advance.seller,
    p_vat_note: advance.vat_note,
    p_details: { ...(advance.details ?? {}), advance_number: advance.number },
    p_paid: true,
    p_advance_id: advance.id,
  });
  if (error) throw error;
  return await deliverFinal(invoice);
}

// The final invoice to the guest; for a gift card, with the card itself
// (a value card in both its versions).
async function sendFinalToGuest(invoice: Invoice) {
  const pdf = await renderInvoicePdf(invoice);
  const card = invoice.source_type === 'gift_card' ? await giftCard(invoice.source_id) : null;
  const message = finalInvoiceGuestEmail(
    invoice,
    card ? { code: card.code, validUntil: card.valid_until, bothVersions: card.kind === 'value' } : undefined,
  );
  await sendToGuest(invoice.customer_email, message, [
    { filename: message.filename, content: toBase64(pdf) },
    ...(card?.files ?? []).map((file) => ({ filename: file.filename, content: toBase64(file.pdf) })),
  ]);
}

async function deliverFinal(invoice: Invoice) {
  let sent: Record<string, unknown> = { status: 'already_sent' };
  if (!invoice.customer_emailed_at) {
    const { data: claimed, error } = await db.rpc('claim_customer_invoice_email', { p_invoice_id: invoice.id });
    if (error) throw error;
    if (claimed) {
      await sendFinalToGuest(invoice);
      await db.from('invoices').update({ customer_emailed_at: new Date().toISOString() }).eq('id', invoice.id);
      sent = { status: 'sent_to_guest' };
    } else {
      sent = { status: 'in_progress' };
    }
  }
  const filed = await attempt(() => archive(invoice));
  return { number: invoice.number, ...sent, filed };
}

async function annul(invoice: Invoice) {
  if (invoice.kind !== 'advance') throw new Error('Only an advance invoice can be annulled');
  if (invoice.status === 'annulled') return { status: 'already_annulled' };
  const { data: final } = await db.from('invoices').select('id').eq('advance_id', invoice.id).maybeSingle();
  if (final) throw new Error('A final invoice has already been issued');
  const { data: updated, error } = await db.from('invoices')
    .update({ status: 'annulled', annulled_at: new Date().toISOString() })
    .eq('id', invoice.id).eq('status', 'issued').select('*').maybeSingle();
  if (error) throw error;
  if (!updated) return { status: 'already_annulled' };
  const filed = await attempt(() => archive(updated));
  return { status: 'annulled', number: invoice.number, filed };
}

// The morning run: bookings whose visit was yesterday or earlier (up to two
// weeks back, in case a run was missed). A booking that has since been deleted
// is taken as cancelled and its advance annulled.
async function finals() {
  if (!(await guestUrl())) return { status: 'finals_off' };
  const today = rigaToday();
  const earliest = addDays(today, -14);
  const results: unknown[] = [];

  const { data: advances, error } = await db.from('invoices').select('*')
    .eq('kind', 'advance').eq('status', 'issued').eq('source_type', 'reservation');
  if (error) throw error;
  const due = (advances ?? []).filter((a) => {
    const date = a.details?.date as string | undefined;
    return date && date < today && date >= earliest;
  });
  if (due.length > 0) {
    const { data: existing } = await db.from('invoices').select('advance_id').eq('kind', 'final')
      .in('advance_id', due.map((a) => a.id));
    const done = new Set((existing ?? []).map((f) => f.advance_id));
    for (const advance of due.filter((a) => !done.has(a.id))) {
      results.push({
        advance: advance.number,
        ...(await attempt(async () => {
          const { data: booking } = await db.from('reservations').select('id').eq('id', advance.source_id).maybeSingle();
          if (!booking) return await annul(advance);
          return await issueFinal(advance);
        })),
      });
    }
  }

  // Guests who paid in cash get the same thanks and review request, without
  // an invoice.
  results.push({ thanks: await attempt(() => thankCashGuests(earliest, today)) });
  return { status: 'finals', results };
}

async function thankCashGuests(earliest: string, today: string) {
  if ((await setting('guest_confirmations')) !== 'on') return { status: 'confirmations_off' };
  const { data: rows, error } = await db.from('reservations').select('id')
    .eq('payment_method', 'cash').gte('reservation_date', earliest).lt('reservation_date', today);
  if (error) throw error;
  const ids = (rows ?? []).map((r) => r.id as string);
  if (ids.length === 0) return { status: 'none' };
  const { data: done } = await db.from('guest_emails').select('source_id')
    .eq('source_type', 'reservation').eq('kind', 'thanks').not('sent_at', 'is', null).in('source_id', ids);
  const sent = new Set((done ?? []).map((r) => r.source_id));
  const results: unknown[] = [];
  for (const id of ids.filter((i) => !sent.has(i))) {
    results.push({
      thanks: id,
      ...(await attempt(async () => {
        const source = await loadSource('reservation', id);
        if (!source || !source.email.includes('@')) return { status: 'no_email' };
        const { data: claimed, error: claimError } = await db.rpc('claim_guest_email', {
          p_source_type: 'reservation', p_source_id: id, p_kind: 'thanks',
        });
        if (claimError) throw claimError;
        if (!claimed) return { status: 'in_progress' };
        await sendToGuest(source.email, thanksEmail(guestInput(source)));
        await db.from('guest_emails').update({ sent_at: new Date().toISOString() })
          .eq('source_type', 'reservation').eq('source_id', id).eq('kind', 'thanks');
        return { status: 'thanked' };
      })),
    });
  }
  return { status: 'thanks', results };
}

// ---------------------------------------------------------------------------
// The 15-minute sweep: anything a failed call left undone.

async function sweep() {
  const since = minutesAgo(24 * 60);
  const settled = minutesAgo(2);
  const recent = minutesAgo(3 * 24 * 60);
  const results: unknown[] = [];
  const confirmationsOn = (await setting('guest_confirmations')) === 'on';

  for (const [type, table] of [['reservation', 'reservations'], ['gift_card', 'davanu_kartes_pasutijumi']] as const) {
    const { data: rows, error } = await db
      .from(table).select(type === 'reservation' ? 'id, payment_method' : 'id')
      .gte('created_at', since).lt('created_at', settled);
    if (error) throw error;
    // deno-lint-ignore no-explicit-any
    const list = (rows ?? []) as any[];
    const ids = list.map((r) => r.id as string);
    if (ids.length === 0) continue;
    const cash = new Set(list.filter((r) => r.payment_method === 'cash').map((r) => r.id as string));

    const [{ data: invoiced }, { data: held }, { data: confirmed }, { data: listed }] = await Promise.all([
      db.from('invoices').select('source_id').eq('source_type', type).eq('kind', 'advance').in('source_id', ids),
      db.from('invoice_holds').select('source_id').eq('source_type', type).in('source_id', ids),
      db.from('guest_emails').select('source_id').eq('source_type', type).eq('kind', 'confirmation')
        .not('sent_at', 'is', null).in('source_id', ids),
      db.from('guest_emails').select('source_id').eq('source_type', type).eq('kind', 'sheet_row')
        .not('sent_at', 'is', null).in('source_id', ids),
    ]);
    const isListed = new Set((listed ?? []).map((r) => r.source_id));
    const hasAdvance = new Set([...(invoiced ?? []), ...(held ?? [])].map((r) => r.source_id));
    const hasConfirmation = new Set((confirmed ?? []).map((r) => r.source_id));
    for (const id of ids) {
      // A cash booking gets a row in the list instead of an invoice.
      const needsAdvance = cash.has(id) ? !isListed.has(id) : !hasAdvance.has(id);
      const needsConfirmation = confirmationsOn && !hasConfirmation.has(id);
      if (!needsAdvance && !needsConfirmation) continue;
      results.push({
        type, id,
        ...(await attempt(async () => {
          const source = await loadSource(type, id);
          if (!source) return { status: 'not_found' };
          const card = await cardState(source);
          if (card === 'awaiting') return { status: 'awaiting_payment' };
          if (card === 'paid') return await paidByCard(source);
          return {
            advance: !needsAdvance
              ? 'done'
              : await attempt(() => (paysCash(source) ? logCashBooking(source) : issueAdvance(source))),
            confirmation: needsConfirmation ? await attempt(() => confirmGuest(source)) : 'done',
          };
        })),
      });
    }
  }

  // Advance invoices not yet with the guest.
  if (await guestUrl()) {
    const { data: guestUnsent } = await db.from('invoices').select('*')
      .eq('kind', 'advance').eq('status', 'issued').is('customer_emailed_at', null).gte('created_at', recent);
    for (const invoice of guestUnsent ?? []) {
      results.push({ to_guest: invoice.number, ...(await attempt(() => deliverAdvanceToGuest(invoice))) });
    }
  }

  // Advance invoices not yet mailed to the office.
  const { data: unsent } = await db.from('invoices').select('*')
    .eq('kind', 'advance').is('emailed_at', null).gte('created_at', recent);
  for (const invoice of unsent ?? []) {
    results.push({ number: invoice.number, ...(await attempt(() => deliverAdvance(invoice))) });
  }

  // Final invoices not yet with the guest.
  const { data: finalsUnsent } = await db.from('invoices').select('*')
    .eq('kind', 'final').is('customer_emailed_at', null).gte('created_at', minutesAgo(7 * 24 * 60));
  for (const invoice of finalsUnsent ?? []) {
    results.push({ number: invoice.number, ...(await attempt(() => deliverFinal(invoice))) });
  }

  // Invoices not yet filed, or annulled and not yet filed as such.
  if (await guestUrl()) {
    const { data: unfiled } = await db.from('invoices').select('*')
      .or('logged_at.is.null,and(status.eq.annulled,annul_logged_at.is.null)')
      .gte('created_at', minutesAgo(30 * 24 * 60));
    for (const invoice of unfiled ?? []) {
      if (invoice.status === 'annulled' && !invoice.logged_at) {
        // Filed first as issued, then as annulled, so the list tells the story.
        await attempt(() => archive({ ...invoice, status: 'issued' }));
      }
      results.push({ filed: invoice.number, ...(await attempt(() => archive(invoice))) });
    }
  }

  // Hold notices the office has not received.
  const { data: unnotified } = await db
    .from('invoice_holds').select('*').is('notified_at', null)
    .gte('created_at', recent).lt('created_at', minutesAgo(10));
  for (const hold of unnotified ?? []) {
    results.push({
      hold: hold.source_id,
      ...(await attempt(async () => {
        const source = await loadSource(hold.source_type, hold.source_id);
        if (!source) return { status: 'not_found' };
        await notifyHold(hold.source_type, hold.source_id, hold.reason, source.fields);
        return { status: 'notified' };
      })),
    });
  }
  results.push({ reminders: await attempt(() => reminders()) });
  return { status: 'swept', results };
}

// ---------------------------------------------------------------------------
// Gift cards: the card itself, drawn from the order and numbered the first
// time it is needed. A ritual card is one PDF. A value card is two, with its
// amount and without it, so the buyer can give whichever they like; `only`
// draws just one of them, for a download.

// The ritual an order is for, as its card describes it; null for a value card.
const ritualOf = (order: { ritual_type?: string | null }) =>
  prices.giftCard.rituals.find((r) => r.label.lv === order.ritual_type || r.label.en === order.ritual_type)?.card ?? null;

async function giftCard(orderId: string, only?: 'value' | 'plain') {
  const { data: order, error } = await db.from('davanu_kartes_pasutijumi').select('*').eq('id', orderId).maybeSingle();
  if (error) throw error;
  if (!order) return null;
  const priced = priceGiftCard(prices, order);
  if (priced.problems.length) throw new Error(`Gift card cannot be priced: ${priced.problems.join('; ')}`);
  const { data: card, error: cardError } = await db.rpc('gift_card_for', { p_order: orderId });
  if (cardError) throw cardError;
  const ritual = ritualOf(order);
  const locale: 'lv' | 'en' = order.locale === 'en' ? 'en' : 'lv';
  const kinds: GiftCardKind[] = ritual ? ['ritual'] : only ? [only] : ['value', 'plain'];
  const name = locale === 'en' ? 'Gift-card' : 'Davanu-karte';
  const suffix: Record<GiftCardKind, string> = {
    ritual: '',
    value: locale === 'en' ? '-with-amount' : '-ar-summu',
    plain: locale === 'en' ? '-without-amount' : '-bez-summas',
  };
  const files: { kind: GiftCardKind; filename: string; pdf: Uint8Array }[] = [];
  for (const kind of kinds) {
    const pdf = await renderGiftCardPdf({
      code: card.code,
      validUntil: card.valid_until,
      locale,
      ritual,
      value: priced.total,
      plain: kind === 'plain',
    });
    files.push({ kind, filename: `${name}-${card.code}${suffix[kind]}.pdf`, pdf });
  }
  return {
    code: card.code as string,
    valid_until: card.valid_until as string,
    kind: ritual ? 'ritual' as const : 'value' as const,
    files,
  };
}

// ---------------------------------------------------------------------------
// Card payments through Stripe Checkout.
//
// The booking form saves the booking or order with payment_method 'card' and
// asks for a Checkout page ({ checkout }). The guest pays there and comes back
// to /apmaksa, which asks how it went ({ payment_status }). Stripe also tells
// this function about every Checkout page that is paid or closes (its
// webhook); the function asks Stripe about the page itself rather than
// trusting what it was sent. Until the guest has paid, or their hour is up,
// nothing goes out: then the guest gets the confirmation and a paid invoice,
// or, if they did not pay, the confirmation and the advance invoice for a
// bank transfer, as if they had chosen one.

const CARD_MINUTES = 60; // how long a Checkout page stays open
const SITE = 'https://saimniekapirts.lv';

interface CardPayment {
  id: string;
  source_type: SourceType;
  source_id: string;
  session_id: string;
  url: string;
  amount: number | string;
  status: 'open' | 'paid' | 'expired';
  paid_at: string | null;
  created_at: string;
  // Set when the page was opened from an invoice's payment link.
  invoice_id?: string | null;
}

const cardPaymentsOn = async () => stripeConfigured() && (await setting('card_payments')) !== 'off';
const isNewerThan = (iso: string, minutes: number) => new Date(iso).getTime() > Date.now() - minutes * 60_000;
const rigaDate = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Europe/Riga' });
const sourceTable = (type: SourceType) => (type === 'reservation' ? 'reservations' : 'davanu_kartes_pasutijumi');

// Runs after the response is sent, where the platform allows it.
const inBackground = (work: Promise<unknown>) => {
  // deno-lint-ignore no-explicit-any
  const runtime = (globalThis as any).EdgeRuntime;
  if (runtime?.waitUntil) runtime.waitUntil(work.catch((e) => console.error(e)));
  else return work.catch((e) => console.error(e));
};

async function cardPayments(type: SourceType, id: string): Promise<CardPayment[]> {
  const { data, error } = await db.from('card_payments').select('*')
    .eq('source_type', type).eq('source_id', id).order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

async function hasCardPayment(source: Source) {
  if (source.row.payment_method !== 'card') return false;
  return (await cardPayments(source.type, source.id)).some((p) => p.status === 'paid');
}

// What Stripe says about a Checkout page, written down. With `close`, a page
// still open is closed first, so it cannot be paid once the booking has moved
// on to a bank transfer.
async function refreshPayment(payment: CardPayment, close = false): Promise<CardPayment> {
  if (payment.status !== 'open') return payment;
  let session: CheckoutSession = await getCheckoutSession(payment.session_id);
  if (close && session.status === 'open') {
    session = await expireCheckoutSession(payment.session_id).catch(() => getCheckoutSession(payment.session_id));
  }
  const paid = session.payment_status === 'paid';
  if (paid && (
    session.amount_total !== Math.round(Number(payment.amount) * 100) ||
    session.currency !== 'eur' ||
    session.metadata?.source_id !== payment.source_id
  )) {
    throw new Error(`Checkout ${payment.session_id} does not match its booking`);
  }
  const status = paid ? 'paid' : session.status === 'expired' ? 'expired' : 'open';
  if (status === 'open') return payment;
  await db.from('card_payments')
    .update({ status, paid_at: paid ? new Date().toISOString() : null, payment_intent: session.payment_intent })
    .eq('id', payment.id).eq('status', 'open');
  const { data, error } = await db.from('card_payments').select('*').eq('id', payment.id).single();
  if (error) throw error;
  return data;
}

// Where a booking the guest chose to pay by card stands. One whose hour is up,
// or whose Checkout page was never opened, moves to a bank transfer.
async function cardState(source: Source): Promise<'none' | 'awaiting' | 'paid' | 'lapsed'> {
  if (source.row.payment_method !== 'card') return 'none';
  const payments = await cardPayments(source.type, source.id);
  if (payments.some((p) => p.status === 'paid')) {
    source.cardPaid = true;
    return 'paid';
  }
  const latest = payments[0];
  const waiting = latest
    ? latest.status === 'open' && isNewerThan(latest.created_at, CARD_MINUTES + 5)
    : isNewerThan(source.row.created_at, 15); // the form opens the page just after saving
  if (waiting) return 'awaiting';
  for (const payment of payments.filter((p) => p.status === 'open')) {
    const now = await refreshPayment(payment, true);
    if (now.status === 'paid') {
      source.cardPaid = true;
      return 'paid';
    }
    if (now.status === 'open') return 'awaiting';
  }
  await toTransfer(source);
  return 'lapsed';
}

async function toTransfer(source: Source) {
  const { error } = await db.from(sourceTable(source.type)).update({ payment_method: 'transfer' }).eq('id', source.id);
  if (error) throw error;
  source.row.payment_method = 'transfer';
}

async function paidByCard(source: Source) {
  const payment = (await cardPayments(source.type, source.id)).find((p) => p.status === 'paid')!;
  const paidOn = rigaDate(payment.paid_at ?? payment.created_at);
  source.cardPaid = true;
  const confirmation = await attempt(() => confirmGuest(source));
  const advance = await attempt(() => issueAdvance(source, paidOn));
  if (source.type === 'reservation') return { paid: true, confirmation, advance };
  // A gift card is settled at once: its final invoice and the card itself go
  // to the guest together.
  const final = await attempt(async () => {
    const { data: issued } = await db.from('invoices').select('*')
      .eq('source_type', 'gift_card').eq('source_id', source.id).eq('kind', 'advance').maybeSingle();
    if (!issued) return { status: 'no_advance' };
    const { data: existing } = await db.from('invoices').select('*').eq('advance_id', issued.id).maybeSingle();
    return existing ? await deliverFinal(existing) : await issueFinal(issued);
  });
  return { paid: true, confirmation, advance, final };
}

// The guest pays by bank transfer after all: the booking gets the usual
// confirmation and advance invoice.
async function fallBack(source: Source, reason: string) {
  await toTransfer(source);
  inBackground(processLoaded(source));
  return { fallback: reason };
}

async function startCheckout(type: SourceType, id: string) {
  const source = await loadSource(type, id);
  if (!source) return { error: 'not_found' };
  if (source.row.payment_method !== 'card') return { status: 'not_card' };
  const payments = await cardPayments(type, id);
  const paid = payments.find((p) => p.status === 'paid');
  if (paid) return { status: 'paid', payment: paid.id };
  // A page opened a moment ago, if the guest comes back to it.
  const open = payments.find((p) => p.status === 'open' && isNewerThan(p.created_at, CARD_MINUTES - 10));
  if (open) return { url: open.url, payment: open.id };

  const reason = !(await cardPaymentsOn()) ? 'card_off'
    : source.priced.problems.length || source.priced.total <= 0 ? 'cannot_price'
    : !source.email.includes('@') ? 'no_email'
    : null;
  if (reason) return await fallBack(source, reason);

  try {
    const paymentId = crypto.randomUUID();
    const lines = source.priced.items.map((item) => ({
      quantity: 1,
      price_data: {
        currency: 'eur',
        unit_amount: Math.round(item.amount * 100),
        product_data: { name: `${item.name[source.locale]}${item.quantity > 1 ? ` × ${item.quantity}` : ''}` },
      },
    }));
    const cents = lines.reduce((sum, line) => sum + line.price_data.unit_amount, 0);
    const what = type === 'reservation' ? visitText(source.details) : 'Dāvanu karte';
    const metadata = { source_type: type, source_id: id, payment: paymentId };
    const session = await createCheckoutSession({
      mode: 'payment',
      line_items: Object.fromEntries(lines.map((line, n) => [n, line])),
      payment_method_types: { 0: 'card' },
      customer_email: source.email.trim(),
      locale: source.locale,
      client_reference_id: id,
      metadata,
      payment_intent_data: { description: `SaimniekaPirts: ${what} · ${source.name.trim()}`, metadata },
      success_url: `${SITE}/apmaksa?p=${paymentId}`,
      cancel_url: `${SITE}/apmaksa?p=${paymentId}&atcelts=1`,
      expires_at: Math.floor(Date.now() / 1000) + CARD_MINUTES * 60,
    }, `checkout-${paymentId}`);
    const { error } = await db.from('card_payments').insert({
      id: paymentId, source_type: type, source_id: id, session_id: session.id, url: session.url, amount: cents / 100,
    });
    if (error) throw error;
    return { url: session.url, payment: paymentId };
  } catch (e) {
    console.error(e);
    return await fallBack(source, 'stripe_error');
  }
}

async function paymentOf(p: unknown): Promise<CardPayment | null> {
  if (typeof p !== 'string' || !uuidPattern.test(p)) return null;
  const { data } = await db.from('card_payments').select('*').eq('id', p).maybeSingle();
  return data;
}

// The /apmaksa page: how a payment went, and what was bought.
async function paymentStatus(body: { p?: string }) {
  const payment = await paymentOf(body.p);
  if (!payment) return json({ error: 'not_found' }, 404);
  let now = payment;
  try {
    now = await refreshPayment(payment);
  } catch (e) {
    console.error(e);
  }
  // Straight away, rather than waiting for Stripe's own message.
  if (now.status === 'paid' && payment.status !== 'paid') await inBackground(afterPayment(now));
  const source = await loadSource(now.source_type, now.source_id);
  if (!source) return json({ error: 'not_found' }, 404);
  let gift: { code: string; valid_until: string; kind: 'ritual' | 'value' } | null = null;
  if (now.status === 'paid' && now.source_type === 'gift_card') {
    const { data } = await db.rpc('gift_card_for', { p_order: now.source_id });
    if (data) gift = { code: data.code, valid_until: data.valid_until, kind: ritualOf(source.row) ? 'ritual' : 'value' };
  }
  return json({
    status: now.status,
    method: source.row.payment_method,
    type: now.source_type,
    locale: source.locale,
    name: source.name.trim().split(/\s+/)[0] ?? '',
    email: source.email,
    date: source.details.date ?? null,
    time: source.details.time ?? null,
    items: source.priced.items.map((i) => ({ name: i.name[source.locale], quantity: i.quantity, amount: i.amount })),
    total: Number(now.amount),
    gift_card: gift,
  });
}

// Back from Stripe without paying: try again, or pay by bank transfer.
async function paymentRetry(body: { p?: string }) {
  const payment = await paymentOf(body.p);
  if (!payment) return json({ error: 'not_found' }, 404);
  return json(await startCheckout(payment.source_type, payment.source_id));
}

async function paymentSwitch(body: { p?: string }) {
  const payment = await paymentOf(body.p);
  if (!payment) return json({ error: 'not_found' }, 404);
  const source = await loadSource(payment.source_type, payment.source_id);
  if (!source) return json({ error: 'not_found' }, 404);
  if (source.row.payment_method !== 'card') return json({ status: 'switched' });
  for (const p of await cardPayments(source.type, source.id)) {
    const now = await refreshPayment(p, true);
    if (now.status === 'paid') {
      await inBackground(processLoaded(source));
      return json({ status: 'paid' });
    }
  }
  await fallBack(source, 'guest_chose_transfer');
  return json({ status: 'switched' });
}

// A value card downloads with its amount, or without it when `plain` asks.
async function giftCardDownload(body: { p?: string; plain?: boolean }) {
  const payment = await paymentOf(body.p);
  if (!payment || payment.source_type !== 'gift_card') return json({ error: 'not_found' }, 404);
  if (payment.status !== 'paid') return json({ error: 'not_paid' }, 409);
  const card = await giftCard(payment.source_id, body.plain ? 'plain' : 'value');
  if (!card) return json({ error: 'not_found' }, 404);
  const [file] = card.files;
  return json({ filename: file.filename, pdf_base64: toBase64(file.pdf) });
}

// Stripe's webhook. Only the Checkout page's id is taken from the message.
// deno-lint-ignore no-explicit-any
async function stripeEvent(event: any) {
  if (typeof event.type !== 'string' || !event.type.startsWith('checkout.session.')) return json({ received: true });
  const sessionId = event.data?.object?.id;
  if (typeof sessionId !== 'string') return json({ received: true });
  const { data: payment } = await db.from('card_payments').select('*').eq('session_id', sessionId).maybeSingle();
  if (!payment) return json({ received: true, ignored: true });
  try {
    const now = await refreshPayment(payment);
    const result = now.status === 'open' ? null : await afterPayment(now);
    return json({ received: true, status: now.status, result });
  } catch (e) {
    console.error(e);
    return json({ error: describe(e) }, 500);
  }
}

// ---------------------------------------------------------------------------
// Invoices the office sends by hand, and paying an invoice by card from a
// link: in the guest's email, or as a QR code the office shows on site.

const payLink = (invoice: { id: string; pay_token?: string }) => `${SITE}/apmaksa?i=${invoice.id}&t=${invoice.pay_token}`;

// A guest who meant to pay in cash is invoiced after all: the booking becomes
// a bank-transfer booking, and its "no invoice" row in the list is marked and
// given another key, so the invoice's own row is the one found from now on.
async function leaveCash(source: Source) {
  if (!paysCash(source)) return;
  const { error } = await db.from('reservations').update({ payment_method: 'transfer' }).eq('id', source.id);
  if (error) throw error;
  source.row.payment_method = 'transfer';
  const url = await guestUrl();
  if (url) {
    await attempt(() => post(url, 'List', {
      route: 'update',
      key: bookingLink(source.id),
      new_key: `${bookingLink(source.id)}#skaidra-nauda`,
      status: 'Aizstāts ar rēķinu',
      booking_status: '—',
    }));
  }
}

// { office: { pin, action: 'send_invoice' | 'pay_link', type, id, pay_link? } }
// send_invoice: the advance invoice (issued now if there is none) goes to the
//   guest, with a link to pay it by card when pay_link is set; after the
//   visit, the final invoice goes instead.
// pay_link: the link (for a QR code) to pay the advance invoice by card. The
//   invoice is issued now if there is none; the 15-minute run then emails it
//   to the guest: as paid, if they have paid by then.
async function officeInvoice(body: { action?: string; type?: string; id?: string; pay_link?: boolean }) {
  const type: SourceType | null = body.type === 'reservation' || body.type === 'gift_card' ? body.type : null;
  if (!type || !body.id || !uuidPattern.test(body.id)) return json({ error: 'not_found' }, 404);
  const source = await loadSource(type, body.id);
  if (!source) return json({ error: 'not_found' }, 404);
  if (!(await guestUrl())) return json({ error: 'guest_mail_off' }, 409);
  if (!source.email.includes('@')) return json({ error: 'no_email' }, 409);

  const { data: final } = await db.from('invoices').select('*')
    .eq('source_type', type).eq('source_id', body.id).eq('kind', 'final').maybeSingle();
  if (final) {
    if (body.action === 'pay_link') return json({ error: 'already_paid' }, 409);
    await sendFinalToGuest(final);
    return json({ status: 'sent', number: final.number, to: final.customer_email });
  }

  await leaveCash(source);
  const made = await createAdvance(source);
  if (!made.invoice) return json({ error: 'cannot_invoice', reason: made.reason ?? '' }, 409);
  const invoice = made.invoice;
  if (invoice.status === 'annulled') return json({ error: 'annulled' }, 409);
  // The office's copy and the list, as for every advance invoice.
  await attempt(() => deliverAdvance(invoice));
  await attempt(() => archive(invoice));
  const paid = !!invoice.paid || (await cardPayments(type, body.id)).some((p) => p.status === 'paid');

  if (body.action === 'pay_link') {
    if (paid) return json({ error: 'already_paid' }, 409);
    if (!(await cardPaymentsOn())) return json({ error: 'card_off' }, 409);
    return json({ status: 'link', number: invoice.number, total: Number(invoice.total), link: payLink(invoice) });
  }

  const withLink = !!body.pay_link && !paid && (await cardPaymentsOn());
  // Keeps the 15-minute run from sending it a second time meanwhile.
  await db.from('invoices').update({ customer_email_attempted_at: new Date().toISOString() }).eq('id', invoice.id);
  const pdf = await renderInvoicePdf(invoice);
  const message = advanceInvoiceGuestEmail(invoice, withLink ? payLink(invoice) : undefined);
  await sendToGuest(invoice.customer_email, message, [{ filename: message.filename, content: toBase64(pdf) }]);
  await db.from('invoices').update({ customer_emailed_at: new Date().toISOString() }).eq('id', invoice.id);
  return json({ status: 'sent', number: invoice.number, to: invoice.customer_email, link: withLink });
}

async function invoiceByLink(body: { i?: string; t?: string }): Promise<Invoice | null> {
  if (typeof body.i !== 'string' || typeof body.t !== 'string' || !uuidPattern.test(body.i) || !uuidPattern.test(body.t)) return null;
  const { data } = await db.from('invoices').select('*').eq('id', body.i).eq('pay_token', body.t).eq('kind', 'advance').maybeSingle();
  return data;
}

async function invoicePaid(invoice: Invoice) {
  if (invoice.paid) return true;
  const { data: final } = await db.from('invoices').select('id').eq('advance_id', invoice.id).maybeSingle();
  if (final) return true;
  return (await cardPayments(invoice.source_type, invoice.source_id)).some((p) => p.status === 'paid');
}

// The page a payment link opens: what the invoice is for and how to pay it.
async function invoicePayment(body: { i?: string; t?: string }) {
  const invoice = await invoiceByLink(body);
  if (!invoice) return json({ error: 'not_found' }, 404);
  const locale = invoice.locale === 'en' ? 'en' : 'lv';
  return json({
    number: invoice.number,
    status: invoice.status,
    paid: await invoicePaid(invoice),
    type: invoice.source_type,
    locale,
    name: invoice.customer_name.trim().split(/\s+/)[0] ?? '',
    date: invoice.details?.date ?? null,
    time: invoice.details?.time ?? null,
    items: invoice.items.map((i) => ({ name: i.name[locale], quantity: i.quantity, amount: i.amount })),
    total: Number(invoice.total),
    due_on: invoice.due_on,
    bank: { payee: invoice.seller.name, iban: invoice.seller.iban, bank: invoice.seller.bank, swift: invoice.seller.swift },
    card: await cardPaymentsOn(),
  });
}

// "Pay by card" on that page: a Stripe Checkout page for the invoice's total.
async function payInvoice(body: { i?: string; t?: string }) {
  const invoice = await invoiceByLink(body);
  if (!invoice) return json({ error: 'not_found' }, 404);
  if (invoice.status === 'annulled') return json({ error: 'annulled' }, 409);
  if (await invoicePaid(invoice)) return json({ status: 'paid' });
  if (!(await cardPaymentsOn())) return json({ error: 'card_off' }, 409);

  const { data: open } = await db.from('card_payments').select('*').eq('invoice_id', invoice.id).eq('status', 'open')
    .order('created_at', { ascending: false }).limit(1);
  const reuse = (open ?? []).find((p) => isNewerThan(p.created_at, CARD_MINUTES - 10));
  if (reuse) return json({ url: reuse.url, payment: reuse.id });

  const locale = invoice.locale === 'en' ? 'en' : 'lv';
  const paymentId = crypto.randomUUID();
  const lines = invoice.items.map((item) => ({
    quantity: 1,
    price_data: {
      currency: 'eur',
      unit_amount: Math.round(item.amount * 100),
      product_data: { name: `${item.name[locale]}${item.quantity > 1 ? ` × ${item.quantity}` : ''}` },
    },
  }));
  const cents = lines.reduce((sum, line) => sum + line.price_data.unit_amount, 0);
  const metadata = { source_type: invoice.source_type, source_id: invoice.source_id, invoice: invoice.number, payment: paymentId };
  const session = await createCheckoutSession({
    mode: 'payment',
    line_items: Object.fromEntries(lines.map((line, n) => [n, line])),
    payment_method_types: { 0: 'card' },
    customer_email: invoice.customer_email,
    locale,
    client_reference_id: invoice.source_id,
    metadata,
    payment_intent_data: { description: `SaimniekaPirts: ${invoice.number} · ${invoice.customer_name}`, metadata },
    success_url: `${SITE}/apmaksa?p=${paymentId}`,
    cancel_url: `${payLink(invoice)}&atcelts=1`,
    expires_at: Math.floor(Date.now() / 1000) + CARD_MINUTES * 60,
  }, `invoice-${paymentId}`);
  const { error } = await db.from('card_payments').insert({
    id: paymentId, source_type: invoice.source_type, source_id: invoice.source_id,
    session_id: session.id, url: session.url, amount: cents / 100, invoice_id: invoice.id,
  });
  if (error) throw error;
  return json({ url: session.url, payment: paymentId });
}

// A guest paid their advance invoice by card from a link: the invoice is
// marked paid (its final invoice will say how), the booking or order counts
// as paid by card, and its row in the list says so. The usual handling then
// runs: a gift card goes out at once with its final invoice, and a guest who
// has not had the invoice by email gets it, marked paid.
async function settleInvoicePayment(payment: CardPayment) {
  const { data: invoice } = await db.from('invoices').select('*').eq('id', payment.invoice_id).maybeSingle();
  if (!invoice) return { status: 'no_invoice' };
  if (!invoice.paid) {
    const paidOn = rigaDate(payment.paid_at ?? payment.created_at);
    const { data: updated } = await db.from('invoices')
      .update({ paid: true, details: { ...(invoice.details ?? {}), payment: 'card', paid_on: paidOn } })
      .eq('id', invoice.id).eq('paid', false).select('id');
    const url = await guestUrl();
    if (updated?.length && url) {
      await attempt(() => post(url, 'List', {
        route: 'update', key: cancelLink(invoice), status: 'Apmaksāts', payment: 'Karte (Stripe)', booking_status: '',
      }));
    }
  }
  const { error } = await db.from(sourceTable(invoice.source_type)).update({ payment_method: 'card' }).eq('id', invoice.source_id);
  if (error) throw error;
  return { status: 'settled', number: invoice.number };
}

async function afterPayment(payment: CardPayment) {
  const settled = payment.status === 'paid' && payment.invoice_id
    ? await attempt(() => settleInvoicePayment(payment))
    : null;
  const result = await processSource(payment.source_type, payment.source_id);
  return settled ? { settled, result } : result;
}

// ---------------------------------------------------------------------------
// The office's invoice page on the website.

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function manage(body: { id?: string; token?: string; pin?: string; action?: string }) {
  const { id, token, pin, action = 'view' } = body;
  if (!id || !token || !uuidPattern.test(id) || !uuidPattern.test(token)) return json({ error: 'bad_link' }, 400);
  const { data: invoice } = await db.from('invoices').select('*').eq('id', id).eq('manage_token', token).maybeSingle();
  if (!invoice) return json({ error: 'not_found' }, 404);
  const { data: final } = await db.from('invoices').select('number').eq('advance_id', invoice.id).maybeSingle();

  const view = (status = invoice.status, finalNumber = final?.number ?? null) => ({
    number: invoice.number,
    kind: invoice.kind,
    status,
    source_type: invoice.source_type,
    customer_name: invoice.customer_name,
    total: invoice.total,
    visit: invoice.details?.date ? `${formatDate(invoice.details.date)} ${invoice.details.time ?? ''}`.trim() : null,
    final_number: finalNumber,
  });
  if (action === 'view') return json(view());

  const pinResult = await pinCheck(pin);
  if (pinResult !== 'ok') return pinRefusal(pinResult);
  try {
    if (action === 'annul') {
      const result = await annul(invoice);
      return json({ ...result, invoice: view('annulled') });
    }
    if (action === 'final') {
      if (final) return json({ error: 'final_exists', invoice: view() }, 409);
      if (!(await guestUrl())) return json({ error: 'guest_mail_off' }, 409);
      const result = await issueFinal(invoice);
      return json({ ...result, invoice: view(invoice.status, (result as { number?: string }).number ?? null) });
    }
    return json({ error: 'unknown_action' }, 400);
  } catch (e) {
    return json({ error: describe(e) }, 409);
  }
}

// 'ok', 'wrong' or 'locked': after ten wrong PINs in fifteen minutes the
// database refuses every PIN until the window passes.
async function pinCheck(pin: unknown): Promise<string> {
  const { data, error } = await db.rpc('invoice_admin_pin_check', { p_pin: String(pin ?? '') });
  if (error) throw error;
  if (data !== 'ok') await new Promise((r) => setTimeout(r, 1500)); // slows guessing
  return data;
}
const pinRefusal = (result: string) =>
  json({ error: result === 'locked' ? 'pin_locked' : 'wrong_pin' }, result === 'locked' ? 429 : 403);

// A booking, opened from the link in the office's calendar. The booking's id
// is the link's secret; cancelling also needs the PIN.
async function manageReservation(body: { reservation?: string; pin?: string; action?: string }) {
  const { reservation: id, pin, action = 'view' } = body;
  if (!id || !uuidPattern.test(id)) return json({ error: 'bad_link' }, 400);
  const { data: booking } = await db.from('reservations').select('*').eq('id', id).maybeSingle();
  const { data: cancelled } = booking
    ? { data: null }
    : await db.from('cancelled_reservations').select('reservation, cancelled_at').eq('id', id).maybeSingle();
  if (!booking && !cancelled) return json({ error: 'not_found' }, 404);
  const row = booking ?? cancelled!.reservation;
  const { data: invoices } = await db.from('invoices').select('*')
    .eq('source_type', 'reservation').eq('source_id', id);
  const advance = (invoices ?? []).find((i) => i.kind === 'advance') ?? null;
  const final = (invoices ?? []).find((i) => i.kind === 'final') ?? null;

  const view = (isCancelled = !booking, advanceStatus = advance?.status ?? null) => ({
    type: 'reservation',
    cancelled: isCancelled,
    customer_name: row.name,
    visit: `${formatDate(row.reservation_date)} ${row.reservation_time ?? ''}`.trim(),
    sauna: row.sauna_type,
    service: row.form_type === 'noma' ? row.rental_type : row.ritual_type,
    advance_number: advance?.number ?? null,
    advance_status: advanceStatus,
    final_number: final?.number ?? null,
  });
  if (action === 'view') return json(view());
  const pinResult = await pinCheck(pin);
  if (pinResult !== 'ok') return pinRefusal(pinResult);

  if (action === 'cancel') {
    if (final) return json({ error: 'final_exists', ...view() }, 409);
    if (!booking) return json({ status: 'already_cancelled', ...view() });
    // The booking goes first, so the row in the list is marked cancelled when
    // the annulled invoice is filed.
    const { error } = await db.rpc('cancel_reservation', { p_id: id });
    if (error) return json({ error: describe(error) }, 409);
    const annulled = advance
      ? await attempt(() => annul(advance))
      : await attempt(() => markCancelledInList(id));
    const calendar = await attempt(() => removeFromCalendar(row));
    return json({ status: 'cancelled', annulled, calendar, ...view(true, advance ? 'annulled' : null) });
  }
  return json({ error: 'unknown_action' }, 400);
}

// The Make scenario the old CRM called after deleting a booking, which takes
// the booking off the office's Google Calendar. It gets the same fields the
// CRM sent. Its address is in Vault as booking_cancelled_webhook_url.
// deno-lint-ignore no-explicit-any
async function removeFromCalendar(r: any) {
  const url = await rpcText('booking_cancelled_url');
  if (!url) return { status: 'calendar_off' };
  await post(url, 'Calendar removal', {
    form_type: r.form_type,
    name: r.name,
    email: r.email,
    phone: r.phone ?? '',
    reservation_date: r.reservation_date,
    reservation_time: r.reservation_time,
    ritual_type: r.ritual_type ?? '',
    ritual_participants: r.ritual_participants ?? null,
    overnight_stay: !!r.overnight_stay,
    ritual_message: r.ritual_message ?? '',
    sauna_type: r.sauna_type ?? '',
    rental_type: r.rental_type ?? '',
    rental_extras: r.rental_extras ?? [],
    rental_message: r.rental_message ?? '',
  });
  return { status: 'sent' };
}

// The office's page on the website (/birojs): upcoming bookings and recent
// gift card orders, with their prices and advance invoices. Every call needs
// the PIN, since the list holds guests' names, emails and phone numbers.
// deno-lint-ignore no-explicit-any
async function office(body: {
  pin?: string; action?: string; reservation?: string; order?: string; plain?: boolean; master_id?: string | null; master?: any;
  type?: string; id?: string; pay_link?: boolean;
}) {
  const pinResult = await pinCheck(body.pin);
  if (pinResult !== 'ok') return pinRefusal(pinResult);
  if (body.action === 'assign') return await assignMaster(body.reservation, body.master_id ?? null);
  if (body.action === 'save_master') return await saveMaster(body.master);
  if (body.action === 'send_invoice' || body.action === 'pay_link') {
    try {
      return await officeInvoice(body);
    } catch (e) {
      console.error(e);
      return json({ error: describe(e) }, 500);
    }
  }
  if (body.action === 'gift_card_pdf') {
    if (!body.order || !uuidPattern.test(body.order)) return json({ error: 'not_found' }, 404);
    try {
      const card = await giftCard(body.order, body.plain ? 'plain' : 'value');
      if (!card) return json({ error: 'not_found' }, 404);
      const [file] = card.files;
      return json({ code: card.code, kind: card.kind, filename: file.filename, pdf_base64: toBase64(file.pdf) });
    } catch (e) {
      return json({ error: describe(e) }, 409);
    }
  }
  if (body.action !== 'list') return json({ error: 'unknown_action' }, 400);

  const today = rigaToday();
  const [bookings, cards] = await Promise.all([
    db.from('reservations').select('*')
      .gte('reservation_date', today).lte('reservation_date', addDays(today, 90))
      .order('reservation_date').order('reservation_time'),
    db.from('davanu_kartes_pasutijumi').select('*')
      .gte('created_at', minutesAgo(90 * 24 * 60)).order('created_at', { ascending: false }),
  ]);
  if (bookings.error) return json({ error: describe(bookings.error) }, 500);
  if (cards.error) return json({ error: describe(cards.error) }, 500);

  const ids = [...(bookings.data ?? []), ...(cards.data ?? [])].map((r) => r.id as string);
  const cardIds = (cards.data ?? []).map((g) => g.id as string);
  const [{ data: invoices, error }, { data: paidByCard }, { data: codes }] = ids.length
    ? await Promise.all([
      db.from('invoices').select('id, number, kind, status, paid, source_id, manage_token, total').in('source_id', ids),
      db.from('card_payments').select('source_id').eq('status', 'paid').in('source_id', ids),
      db.from('gift_cards').select('order_id, code, valid_until').in('order_id', cardIds.length ? cardIds : [crypto.randomUUID()]),
    ])
    : [{ data: [], error: null }, { data: [] }, { data: [] }];
  if (error) return json({ error: describe(error) }, 500);
  const cardPaid = new Set((paidByCard ?? []).map((p) => p.source_id));
  // deno-lint-ignore no-explicit-any
  const codeOf = (id: string) => (codes ?? []).find((c: any) => c.order_id === id) ?? null;

  // deno-lint-ignore no-explicit-any
  const invoiceOf = (sourceId: string) => (invoices ?? []).filter((i: any) => i.source_id === sourceId);
  // deno-lint-ignore no-explicit-any
  const invoiceView = (sourceId: string, priced: any) => {
    const mine = invoiceOf(sourceId);
    const advance = mine.find((i) => i.kind === 'advance');
    const final = mine.find((i) => i.kind === 'final');
    return {
      items: priced.items.map((i: { name: { lv: string }; quantity: number; amount: number }) =>
        ({ name: i.name.lv, quantity: i.quantity, amount: i.amount })),
      total: advance ? Number(advance.total) : priced.problems.length ? null : priced.total,
      advance: advance
        ? { number: advance.number, status: advance.status, paid: !!advance.paid, link: `/rekins?id=${advance.id}&t=${advance.manage_token}` }
        : null,
      final: final ? { number: final.number } : null,
    };
  };

  return json({
    today,
    bookings: (bookings.data ?? []).map((r) => ({
      id: r.id,
      type: r.form_type === 'noma' ? 'noma' : 'ritual',
      date: r.reservation_date,
      time: r.reservation_time,
      sauna: r.sauna_type,
      service: r.form_type === 'noma' ? r.rental_type : r.ritual_type,
      participants: r.ritual_participants,
      overnight: !!r.overnight_stay,
      transport: transportName(r.transport, 'lv') || null,
      payment: ['cash', 'card'].includes(r.payment_method) ? r.payment_method : 'transfer',
      card_paid: cardPaid.has(r.id),
      master_id: r.master_id ?? null,
      message: (r.form_type === 'noma' ? r.rental_message : r.ritual_message) || null,
      name: r.name,
      email: r.email,
      phone: r.phone || null,
      locale: r.locale === 'en' ? 'en' : 'lv',
      created_at: r.created_at,
      ...invoiceView(r.id, priceReservation(prices, r)),
    })),
    gift_cards: (cards.data ?? []).map((g) => ({
      id: g.id,
      name: g.vards_uzvards,
      email: g.epasts,
      phone: g.talrunis || null,
      service: String(g.ritual_type ?? '').startsWith('Custom Value')
        ? `Dāvanu karte, ${g.custom_price_value ?? ''}`
        : g.ritual_type,
      locale: g.locale === 'en' ? 'en' : 'lv',
      created_at: g.created_at,
      payment: g.payment_method === 'card' ? 'card' : 'transfer',
      card_paid: cardPaid.has(g.id),
      gift_card: codeOf(g.id),
      // A value card has two versions: with its amount and without it.
      kind: ritualOf(g) ? 'ritual' : 'value',
      ...invoiceView(g.id, priceGiftCard(prices, g)),
    })),
    masters: await mastersList(),
    card_payments: await cardPaymentsOn(),
  });
}

// ---------------------------------------------------------------------------
// Sauna masters: the office assigns them to bookings, and each has a private
// link to their own list.

const masterLink = (token: string) => `https://saimniekapirts.lv/pirtnieks?t=${token}`;

async function mastersList() {
  const today = rigaToday();
  const [{ data: masters, error }, { data: assigned }] = await Promise.all([
    db.from('sauna_masters').select('*').order('active', { ascending: false }).order('name'),
    db.from('reservations').select('master_id').not('master_id', 'is', null).gte('reservation_date', today),
  ]);
  if (error) throw error;
  const count = (id: string) => (assigned ?? []).filter((r) => r.master_id === id).length;
  return (masters ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    phone: m.phone,
    email: m.email,
    active: m.active,
    link: masterLink(m.token),
    upcoming: count(m.id),
  }));
}

async function assignMaster(reservation: string | undefined, masterId: string | null) {
  if (!reservation || !uuidPattern.test(reservation)) return json({ error: 'bad_link' }, 400);
  if (masterId !== null && !uuidPattern.test(masterId)) return json({ error: 'unknown_master' }, 400);
  if (masterId) {
    const { data: master } = await db.from('sauna_masters').select('id').eq('id', masterId).maybeSingle();
    if (!master) return json({ error: 'unknown_master' }, 404);
  }
  const { data, error } = await db.from('reservations').update({ master_id: masterId })
    .eq('id', reservation).select('id').maybeSingle();
  if (error) return json({ error: describe(error) }, 500);
  if (!data) return json({ error: 'not_found' }, 404);
  return json({ status: 'assigned' });
}

// deno-lint-ignore no-explicit-any
async function saveMaster(m: any) {
  const text = (v: unknown, max = 120) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const name = text(m?.name);
  if (!name) return json({ error: 'Norādiet pirtnieka vārdu.' }, 400);
  const fields: Record<string, unknown> = {
    name,
    phone: text(m?.phone, 40) || null,
    email: text(m?.email, 120) || null,
    active: m?.active !== false,
  };
  if (m?.id) {
    if (!uuidPattern.test(m.id)) return json({ error: 'unknown_master' }, 400);
    if (m.new_link) fields.token = crypto.randomUUID();
    const { error } = await db.from('sauna_masters').update(fields).eq('id', m.id);
    if (error) return json({ error: describe(error) }, 500);
  } else {
    const { error } = await db.from('sauna_masters').insert(fields);
    if (error) return json({ error: describe(error) }, 500);
  }
  return json({ masters: await mastersList() });
}

// A master's own page. The token in their link is the only key, so an
// inactive master's link stops working.
async function masterView(body: { token?: string }) {
  const token = body?.token ?? '';
  if (!uuidPattern.test(token)) return json({ error: 'unknown_master' }, 404);
  const { data: master } = await db.from('sauna_masters').select('*').eq('token', token).eq('active', true).maybeSingle();
  if (!master) return json({ error: 'unknown_master' }, 404);
  const today = rigaToday();
  const { data: rows, error } = await db.from('reservations').select('*').eq('master_id', master.id)
    .gte('reservation_date', today).lte('reservation_date', addDays(today, 90))
    .order('reservation_date').order('reservation_time');
  if (error) return json({ error: describe(error) }, 500);
  return json({
    name: master.name,
    today,
    bookings: (rows ?? []).map((r) => {
      const priced = priceReservation(prices, r);
      return {
        id: r.id,
        type: r.form_type === 'noma' ? 'noma' : 'ritual',
        date: r.reservation_date,
        time: r.reservation_time,
        sauna: r.sauna_type,
        service: r.form_type === 'noma' ? r.rental_type : r.ritual_type,
        participants: r.ritual_participants,
        overnight: !!r.overnight_stay,
        transport: transportName(r.transport, 'lv') || null,
        message: (r.form_type === 'noma' ? r.rental_message : r.ritual_message) || null,
        name: r.name,
        phone: r.phone || null,
        locale: r.locale === 'en' ? 'en' : 'lv',
        cash_due: r.payment_method === 'cash' && priced.problems.length === 0 ? priced.total : null,
      };
    }),
  });
}

// ---------------------------------------------------------------------------
// Previews, which use no numbers and reach only the office.

async function preview(type: SourceType, id: string, kind: 'advance' | 'final' = 'advance') {
  const source = await loadSource(type, id);
  if (!source) return null;
  const invoice: Invoice = {
    id: 'preview',
    kind,
    status: 'issued',
    paid: kind === 'final',
    number: kind === 'final' ? 'SP-PARAUGS' : 'AR-PARAUGS',
    issued_on: rigaToday(),
    due_on: kind === 'final' ? rigaToday() : source.dueOn,
    source_type: type,
    source_id: id,
    locale: source.locale,
    customer_name: source.name,
    customer_email: source.email,
    customer_phone: source.phone || null,
    items: source.priced.items,
    total: source.priced.total,
    seller: typedSeller,
    vat_note: VAT_NOTE,
    details: kind === 'final' ? { ...source.details, advance_number: 'AR-PARAUGS' } : source.details,
    manage_token: '00000000-0000-0000-0000-000000000000',
    pay_token: '00000000-0000-0000-0000-000000000000',
  };
  const pdf = toBase64(await renderInvoicePdf(invoice));
  return { source, invoice, pdf };
}

// What the guest would receive for one booking, sent to the office instead.
async function previewToOffice(type: SourceType, id: string) {
  const advance = await preview(type, id, 'advance');
  const final = await preview(type, id, 'final');
  if (!advance || !final) return { status: 'not_found' };
  const confirmation = confirmationFor(advance.source);
  await sendToOffice({ subject: `PARAUGS · klienta apstiprinājums · ${confirmation.subject}`, html: confirmation.html, text: '' });
  if (type === 'reservation') {
    const reminder = reminderEmail(guestInput(advance.source));
    await sendToOffice({ subject: `PARAUGS · atgādinājums dienu iepriekš · ${reminder.subject}`, html: reminder.html, text: '' });
  }
  const guestAdvance = advanceInvoiceGuestEmail(advance.invoice);
  await sendToOffice(
    { subject: `PARAUGS · avansa rēķins klientam · ${guestAdvance.subject}`, html: guestAdvance.html, text: '' },
    { filename: guestAdvance.filename, content: advance.pdf },
  );
  const office = invoiceEmail(advance.invoice);
  await sendToOffice(
    { subject: `PARAUGS · ${office.subject}`, html: office.html, text: office.text },
    { filename: office.filename, content: advance.pdf },
  );
  const guest = finalInvoiceGuestEmail(final.invoice);
  await sendToOffice(
    { subject: `PARAUGS · gala rēķins klientam · ${guest.subject}`, html: guest.html, text: '' },
    { filename: guest.filename, content: final.pdf },
  );
  return { status: 'previews_sent' };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  const body = await req.json().catch(() => ({}));

  // Stripe's webhook, and the booking forms' card payments. A payment is
  // found by its own random id (or a booking by its secret id).
  try {
    if (body.object === 'event') return await stripeEvent(body);
    if (body.payment_options) return json({ card: await cardPaymentsOn() });
    if (body.checkout) {
      const { type: t, id } = body.checkout;
      if ((t !== 'reservation' && t !== 'gift_card') || typeof id !== 'string' || !uuidPattern.test(id)) {
        return json({ error: 'bad_request' }, 400);
      }
      return json(await startCheckout(t, id));
    }
    if (body.payment_status) return await paymentStatus(body.payment_status);
    if (body.payment_retry) return await paymentRetry(body.payment_retry);
    if (body.payment_switch) return await paymentSwitch(body.payment_switch);
    if (body.gift_card_pdf) return await giftCardDownload(body.gift_card_pdf);
    if (body.invoice_payment) return await invoicePayment(body.invoice_payment);
    if (body.pay_invoice) return await payInvoice(body.pay_invoice);
  } catch (e) {
    console.error(e);
    return json({ error: describe(e) }, 500);
  }

  // The website's office page: guarded by the link and the PIN.
  if (body.sauna_master) return await masterView(body.sauna_master);
  if (body.office) return await office(body.office);
  if (body.manage?.reservation) return await manageReservation(body.manage);
  if (body.manage) return await manage(body.manage);

  const secret = req.headers.get('x-invoice-secret') ?? '';
  const { data: allowed, error: authError } = secret
    ? await db.rpc('invoice_hook_secret_matches', { p_secret: secret })
    : { data: false, error: null };
  if (authError) return json({ error: 'auth check failed' }, 500);
  if (!allowed) return json({ error: 'forbidden' }, 403);

  const type = body.source_type as SourceType;
  const validSource = (type === 'reservation' || type === 'gift_card') && typeof body.source_id === 'string';

  try {
    if (body.dry_run) {
      if (!validSource) return json({ error: 'source required' }, 400);
      const p = await preview(type, body.source_id, body.kind === 'final' ? 'final' : 'advance');
      if (!p) return json({ status: 'not_found' });
      return json({
        status: 'preview',
        total: p.source.priced.total,
        problems: p.source.priced.problems,
        email: p.invoice.kind === 'final' ? finalInvoiceGuestEmail(p.invoice) : invoiceEmail(p.invoice),
        confirmation: confirmationFor(p.source),
        pdf_base64: p.pdf,
      });
    }
    if (body.preview_to_office) {
      return validSource ? json(await previewToOffice(type, body.source_id)) : json({ error: 'source required' }, 400);
    }
    if (!(await officeUrl())) return json({ status: 'disabled', reason: 'invoice_make_webhook_url is not in Vault' });
    if (body.sweep) return json(await sweep());
    if (body.finals) return json(await finals());
    if (validSource) return json(await processSource(type, body.source_id));
    return json({ error: 'nothing to do' }, 400);
  } catch (e) {
    console.error(e);
    return json({ status: 'error', error: describe(e) }, 500);
  }
});
