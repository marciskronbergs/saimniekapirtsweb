// Every email this function writes.
//
// To the office (Latvian): a copy of each advance invoice with a link for
// annulling it; and the notice that a booking could not be priced.
//
// To guests (in the language they booked in): the booking confirmation, then
// in a separate email the advance invoice, a reminder the day before the
// visit, and after the visit the final invoice with thanks and a request for
// a review.

import { formatDate, formatMoney, type InvoiceRow, type InvoiceDetails } from './pdf.ts';
import type { PricedOrder } from './pricing.ts';

type Locale = 'lv' | 'en';

// Where guests find us and review us. The map link is the one the owner
// shares; Waze finds the gate when searched for by name.
export const MAP_URL = 'https://share.google/KE7fXPd8s220O9YdS';
export const WAZE_URL = 'https://waze.com/ul?q=saimniekapirts&navigate=yes';
export const REVIEW_URL = 'https://www.google.com/maps?cid=15868172019720510571';
const LOGO_URL =
  'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/logo/logoTitle.png';
const MANAGE_URL = 'https://saimniekapirts.lv/rekins';

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const eur = (n: number | string, locale: Locale = 'lv') =>
  locale === 'lv' ? `${formatMoney(Number(n), 'lv')} €` : `€${formatMoney(Number(n), 'en')}`;

const longDate = (iso: string, locale: Locale) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString(locale === 'lv' ? 'lv-LV' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

const saunaName = (sauna: string | undefined, locale: Locale) =>
  !sauna ? '' : locale === 'lv' ? sauna : sauna === 'Baltā pirts' ? 'White sauna' : sauna === 'Pelēkā pirts' ? 'Grey sauna' : sauna;

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? '';

const visitLv = (d: InvoiceDetails | null) =>
  d?.kind === 'reservation' && d.date
    ? [formatDate(d.date), d.time, d.sauna].filter(Boolean).join(', ')
    : 'dāvanu karte';

// ---------------------------------------------------------------------------
// Shared look for guest emails: a dark band with the logo, as on the website.

function guestLayout(title: string, body: string, locale: Locale, seller: InvoiceRow['seller']) {
  const signOff = locale === 'lv' ? 'Ar cieņu' : 'Kind regards';
  return `<!doctype html><html><body style="margin:0;background:#f3f5f3;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f5f3;padding:24px 0"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden">
<tr><td style="background:#0a0a0a;padding:22px 28px"><img src="${LOGO_URL}" alt="SaimniekaPirts" height="40" style="display:block;height:40px;border:0"></td></tr>
<tr><td style="padding:28px 28px 8px"><h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#111">${title}</h1>
${body}
<p style="margin:26px 0 4px;font-size:15px">${signOff},<br><strong>Mārcis Kronbergs</strong><br>${escapeHtml(seller.tradeName)}</p>
<p style="margin:0 0 24px;font-size:14px;color:#555"><a href="tel:${seller.phone.replace(/\s/g, '')}" style="color:#2e7d32">${seller.phone}</a> · <a href="mailto:${seller.email}" style="color:#2e7d32">${seller.email}</a> · <a href="https://${seller.web}" style="color:#2e7d32">${seller.web}</a></p>
</td></tr></table></td></tr></table></body></html>`;
}

const p = (html: string) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.55">${html}</p>`;
const h2 = (text: string) => `<h2 style="margin:22px 0 8px;font-size:16px;color:#2e7d32">${text}</h2>`;
const list = (items: string[]) =>
  `<ul style="margin:0 0 14px;padding-left:20px;font-size:15px;line-height:1.55">${items.map((i) => `<li style="margin:0 0 4px">${i}</li>`).join('')}</ul>`;
const button = (href: string, label: string) =>
  `<p style="margin:18px 0"><a href="${href}" style="display:inline-block;background:#2e7d32;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:bold;font-size:15px">${label}</a></p>`;
const replyBox = (html: string) =>
  `<div style="background:#fff7e0;border:1px solid #e8c766;border-radius:8px;padding:12px 14px;margin:0 0 16px;font-size:15px;line-height:1.5">${html}</div>`;

function detailsTable(rows: [string, string][], priced: PricedOrder | null, locale: Locale) {
  const line = (k: string, v: string, strong = false) =>
    `<tr><td style="padding:5px 16px 5px 0;color:#555;font-size:14px;vertical-align:top">${k}</td><td style="padding:5px 0;font-size:15px;${strong ? 'font-weight:bold' : ''}">${v}</td></tr>`;
  let html = rows.filter(([, v]) => v).map(([k, v]) => line(escapeHtml(k), escapeHtml(v))).join('');
  if (priced && priced.items.length) {
    const items = priced.items
      .map((i) => `${escapeHtml(i.name[locale])}${i.quantity > 1 ? ` × ${i.quantity}` : ''} – ${eur(i.amount, locale)}`)
      .join('<br>');
    html += line(locale === 'lv' ? 'Pakalpojumi' : 'Services', items);
    html += priced.problems.length === 0
      ? line(locale === 'lv' ? 'Kopā' : 'Total', eur(priced.total, locale), true)
      : line(locale === 'lv' ? 'Kopā' : 'Total', locale === 'lv' ? 'precizēsim' : 'to be confirmed', true);
  }
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#f6f8f6;border-radius:8px;padding:10px 16px;margin:0 0 16px">${html}</table>`;
}

type Tr = (lv: string, en: string) => string;

// Directions, in the confirmation and again in the reminder.
const findUs = (t: Tr) =>
  h2(t('Kā pie mums nokļūt', 'How to find us')) +
  p(t(`Adrese: "Sarma Nr. 123", Baldones pagasts, Ķekavas novads, LV-2125.`,
    `Address: "Sarma Nr. 123", Baldone parish, Ķekava municipality, LV-2125, Latvia.`)) +
  p(t(`Atrašanās vieta kartē: <a href="${MAP_URL}" style="color:#2e7d32">atvērt Google Maps</a>. Waze lietotnē meklējiet <strong>"saimniekapirts"</strong> – tā atvedīs līdz pašiem vārtiem (<a href="${WAZE_URL}" style="color:#2e7d32">atvērt Waze</a>). Teritorijā ir plaša privāta autostāvvieta.`,
    `Location on the map: <a href="${MAP_URL}" style="color:#2e7d32">open Google Maps</a>. In Waze, search for <strong>"saimniekapirts"</strong> – it takes you right to the gate (<a href="${WAZE_URL}" style="color:#2e7d32">open Waze</a>). There is plenty of private parking on site.`)) +
  p(t('Ar sabiedrisko transportu brauciet maršrutā Rīga – Baldone; ja atbildēsiet uz šo e-pastu, varam Jūs savākt Baldones autoostā.',
    'By public transport, take the Riga – Baldone route; reply to this email and we can collect you from the Baldone bus station.'));

const whatToBring = (t: Tr, ritual: boolean) =>
  h2(ritual ? t('Kas ir iekļauts un ko ņemt līdzi', 'What is included and what to bring') : t('Ko ņemt līdzi', 'What to bring')) +
  list(ritual
    ? [
        t('Iekļauts: dvieļi, lina dvieļi, pirts cepures un halāti.', 'Included: towels, linen sheets, sauna hats and bathrobes.'),
        t('Paņemiet līdzi gumijas vai baseina čības.', 'Bring rubber or pool slippers.'),
        t('Dienu iepriekš un rituāla dienā dzeriet daudz ūdens; dienu iepriekš ieteicams vieglāks ēdiens bez gaļas.', 'Drink plenty of water the day before and on the day; a lighter meal without meat the day before is best.'),
        t('Pirms rituāla pastāstiet pirtniekam par savu veselību, alerģijām un lietotajiem medikamentiem.', 'Before the ritual, tell the sauna master about your health, any allergies and medication.'),
        t('Savu ēdienu drīkst ņemt līdzi. Alkohols un citas apreibinošas vielas teritorijā nav atļautas.', 'You are welcome to bring your own food. Alcohol and other intoxicants are not allowed on the premises.'),
      ]
    : [
        t('Dvieļus var izīrēt uz vietas – 4 € par dvieli – vai paņemt savus.', 'Towels can be rented on site for €4 each, or bring your own.'),
        t('Paņemiet līdzi gumijas vai baseina čības.', 'Bring rubber or pool slippers.'),
        t('Savu ēdienu drīkst ņemt līdzi. Alkohols un citas apreibinošas vielas teritorijā nav atļautas.', 'You are welcome to bring your own food. Alcohol and other intoxicants are not allowed on the premises.'),
      ]);

const callUs = `<a href="tel:+37126752661" style="color:#2e7d32">+371 26 752 661</a>`;

// ---------------------------------------------------------------------------
// Booking confirmation to the guest.

export interface ConfirmationInput {
  type: 'reservation' | 'gift_card';
  locale: Locale;
  name: string;
  formType?: string; // 'ritual' | 'noma'
  date?: string;
  time?: string;
  sauna?: string;
  participants?: number | null;
  overnight?: boolean;
  giftLabel?: string;
  priced: PricedOrder;
  individual?: boolean;
  seller: InvoiceRow['seller'];
}

export function confirmationEmail(c: ConfirmationInput) {
  const lv = c.locale === 'lv';
  const who = escapeHtml(firstName(c.name));
  const t = (a: string, b: string) => (lv ? a : b);

  if (c.type === 'gift_card') {
    const subject = t('Dāvanu kartes pasūtījums saņemts · SaimniekaPirts', 'Gift card order received · SaimniekaPirts');
    const body = [
      p(t(`Sveiki, ${who}!`, `Hello ${who},`)),
      p(t('Paldies par dāvanu kartes pasūtījumu! Tā ir lieliska dāvana – pirts rituāls, ko atceras ilgi.',
        'Thank you for ordering a gift card – a sauna ritual is a gift people remember for a long time.')),
      detailsTable([], c.priced, c.locale),
      h2(t('Kas notiks tālāk', 'What happens next')),
      list([
        t('Rēķinu apmaksai nosūtām atsevišķā e-pastā – tas pienāks pēc dažām minūtēm.', 'The invoice for payment follows in a separate email within a few minutes.'),
        t('Pēc apmaksas sagatavosim un nosūtīsim dāvanu karti.', 'Once it is paid, we will prepare the gift card and send it to you.'),
        t('Dāvanu karte ir derīga vienu gadu. Ja nepieciešams, termiņu varam pagarināt.', 'The gift card is valid for one year, and we can extend it if needed.'),
      ]),
      p(t('Ja rodas jautājumi, zvaniet vai rakstiet – labprāt palīdzēsim.', 'If you have any questions, call or write – we are happy to help.')),
    ].join('');
    return { subject, html: guestLayout(t('Pasūtījums saņemts', 'Order received'), body, c.locale, c.seller) };
  }

  const ritual = c.formType === 'ritual';
  const dateText = c.date ? longDate(c.date, c.locale) : '';
  const subject = t(
    `Rezervācija apstiprināta: ${ritual ? 'pirts rituāls' : 'pirts noma'} ${c.date ? formatDate(c.date) : ''} plkst. ${c.time ?? ''} · SaimniekaPirts`,
    `Booking confirmed: ${ritual ? 'sauna ritual' : 'sauna rental'} on ${c.date ? formatDate(c.date) : ''} at ${c.time ?? ''} · SaimniekaPirts`
  );
  const duration = ritual
    ? t(c.individual ? 'Individuālais rituāls ilgst līdz 3 stundām.' : 'Rituāls ilgst līdz 4 stundām.',
      c.individual ? 'An individual ritual lasts up to 3 hours.' : 'The ritual lasts up to 4 hours.')
    : '';

  const body = [
    p(t(`Sveiki, ${who}!`, `Hello ${who},`)),
    p(ritual
      ? t('Paldies, ka izvēlējāties SaimniekaPirts! Jūsu pirts rituāls ir rezervēts, un mēs jau gatavojamies Jūs sagaidīt.',
        'Thank you for choosing SaimniekaPirts! Your sauna ritual is booked and we are looking forward to welcoming you.')
      : t('Paldies, ka izvēlējāties SaimniekaPirts! Jūsu pirts noma ir rezervēta.',
        'Thank you for choosing SaimniekaPirts! Your sauna rental is booked.')),
    replyBox(t('<strong>Lūdzu, atbildiet uz šo e-pastu</strong> (pietiek ar vārdu "Saņemts"), lai mēs zinātu, ka rezervācijas apstiprinājums Jūs ir sasniedzis.',
      '<strong>Please reply to this email</strong> (just "Received" is enough) so we know the confirmation has reached you.')),
    h2(t('Jūsu rezervācija', 'Your booking')),
    detailsTable([
      [t('Datums', 'Date'), dateText],
      [t('Sākuma laiks', 'Start time'), c.time ?? ''],
      [t('Pirts', 'Sauna'), saunaName(c.sauna, c.locale)],
      [t('Personu skaits', 'Number of people'), c.participants ? String(c.participants) : ''],
      [t('Nakšņošana', 'Overnight stay'), c.overnight ? t('jā', 'yes') : ''],
    ], c.priced, c.locale),
    duration ? p(duration) : '',
    findUs(t),
    whatToBring(t, ritual),
    h2(t('Apmaksa', 'Payment')),
    p(t('Norēķināties var ar pārskaitījumu pirms apmeklējuma (avansa rēķinu nosūtām atsevišķā e-pastā) vai skaidrā naudā uz vietas.',
      'You can pay by bank transfer before your visit (the advance invoice follows in a separate email) or in cash on site.')),
    h2(t('Izmaiņas un atcelšana', 'Changes and cancellation')),
    p(t(`Rezervāciju var pārcelt vai atcelt bez maksas. Lūdzu, paziņojiet pēc iespējas agrāk – zvaniet <a href="tel:+37126752661" style="color:#2e7d32">+371 26 752 661</a> vai atbildiet uz šo e-pastu.`,
      `You can move or cancel your booking free of charge. Please let us know as early as you can – call <a href="tel:+37126752661" style="color:#2e7d32">+371 26 752 661</a> or reply to this email.`)),
    p(t('Gaidīsim Jūs! 🌿', 'We look forward to seeing you! 🌿')),
  ].join('');

  return { subject, html: guestLayout(t('Rezervācija apstiprināta', 'Your booking is confirmed'), body, c.locale, c.seller) };
}

// ---------------------------------------------------------------------------
// Reminder to the guest, the day before the visit.

export function reminderEmail(c: ConfirmationInput) {
  const lv = c.locale === 'lv';
  const who = escapeHtml(firstName(c.name));
  const t: Tr = (a, b) => (lv ? a : b);
  const ritual = c.formType === 'ritual';
  const subject = t(
    `Atgādinājums: rīt plkst. ${c.time ?? ''} ${ritual ? 'pirts rituāls' : 'pirts noma'} · SaimniekaPirts`,
    `Reminder: your ${ritual ? 'sauna ritual' : 'sauna rental'} tomorrow at ${c.time ?? ''} · SaimniekaPirts`
  );
  const body = [
    p(t(`Sveiki, ${who}!`, `Hello ${who},`)),
    p(ritual
      ? t(`Atgādinām, ka rīt, <strong>${c.date ? longDate(c.date, 'lv') : ''}, plkst. ${c.time ?? ''}</strong>, Jūs gaida pirts rituāls SaimniekaPirts. Mēs jau gatavojam pirti!`,
        `A reminder that your sauna ritual at SaimniekaPirts is tomorrow, <strong>${c.date ? longDate(c.date, 'en') : ''}, at ${c.time ?? ''}</strong>. We are getting the sauna ready!`)
      : t(`Atgādinām, ka rīt, <strong>${c.date ? longDate(c.date, 'lv') : ''}, plkst. ${c.time ?? ''}</strong>, Jūs gaida pirts noma SaimniekaPirts.`,
        `A reminder that your sauna rental at SaimniekaPirts is tomorrow, <strong>${c.date ? longDate(c.date, 'en') : ''}, at ${c.time ?? ''}</strong>.`)),
    detailsTable([
      [t('Sākuma laiks', 'Start time'), c.time ?? ''],
      [t('Pirts', 'Sauna'), saunaName(c.sauna, c.locale)],
      [t('Personu skaits', 'Number of people'), c.participants ? String(c.participants) : ''],
      [t('Nakšņošana', 'Overnight stay'), c.overnight ? t('jā', 'yes') : ''],
    ], null, c.locale),
    findUs(t),
    whatToBring(t, ritual),
    h2(t('Apmaksa', 'Payment')),
    p(t('Ja avansa rēķins vēl nav apmaksāts, var norēķināties arī skaidrā naudā uz vietas.',
      'If the advance invoice has not been paid yet, you can also pay in cash on site.')),
    h2(t('Ja plāni mainījušies', 'If your plans have changed')),
    p(t(`Lūdzu, paziņojiet mums pēc iespējas ātrāk – zvaniet ${callUs} vai atbildiet uz šo e-pastu.`,
      `Please let us know as soon as possible – call ${callUs} or reply to this email.`)),
    p(t('Uz tikšanos rīt! 🌿', 'See you tomorrow! 🌿')),
  ].join('');
  return { subject, html: guestLayout(t('Uz tikšanos rīt!', 'See you tomorrow!'), body, c.locale, c.seller) };
}

// ---------------------------------------------------------------------------
// Advance invoice to the guest, straight after the confirmation.

export function advanceInvoiceGuestEmail(invoice: InvoiceRow) {
  const lv = invoice.locale === 'lv';
  const t = (a: string, b: string) => (lv ? a : b);
  const who = escapeHtml(firstName(invoice.customer_name));
  const d = invoice.details;
  const visit = d?.kind === 'reservation';
  const seller = invoice.seller;
  const what = visit && d?.date
    ? t(`par apmeklējumu ${formatDate(d.date)} plkst. ${d.time ?? ''}`, `for your visit on ${formatDate(d.date)} at ${d.time ?? ''}`)
    : t('par dāvanu karti', 'for your gift card');
  const subject = t(`Avansa rēķins ${invoice.number} · SaimniekaPirts`, `Advance invoice ${invoice.number} · SaimniekaPirts`);
  const body = [
    p(t(`Sveiki, ${who}!`, `Hello ${who},`)),
    p(t(`Pielikumā ir avansa rēķins Nr. ${invoice.number} ${what}.`,
      `Attached is advance invoice ${invoice.number} ${what}.`)),
    detailsTable([
      [t('Summa', 'Amount'), eur(invoice.total, invoice.locale)],
      [t('Apmaksāt līdz', 'Due by'), formatDate(invoice.due_on)],
      [t('Saņēmējs', 'Payee'), seller.name],
      [t('Konts', 'Account (IBAN)'), seller.iban],
      [t('Banka', 'Bank'), `${seller.bank}, SWIFT ${seller.swift}`],
      [t('Maksājuma mērķis', 'Payment reference'), invoice.number],
    ], null, invoice.locale),
    visit
      ? p(t('Ja ērtāk, var norēķināties arī skaidrā naudā uz vietas.', 'If you prefer, you can also pay in cash on site.'))
      : p(t('Pēc apmaksas sagatavosim un nosūtīsim dāvanu karti.', 'Once it is paid, we will prepare the gift card and send it to you.')),
    p(visit ? t('Gaidīsim Jūs! 🌿', 'We look forward to seeing you! 🌿') : t('Paldies par pasūtījumu! 🌿', 'Thank you for your order! 🌿')),
  ].join('');
  const filename = `${lv ? 'Avansa-rekins' : 'Advance-invoice'}-${invoice.number}.pdf`;
  return { subject, html: guestLayout(t('Avansa rēķins', 'Advance invoice'), body, invoice.locale, seller), filename };
}

// ---------------------------------------------------------------------------
// Final invoice to the guest.

export function finalInvoiceGuestEmail(invoice: InvoiceRow) {
  const lv = invoice.locale === 'lv';
  const t = (a: string, b: string) => (lv ? a : b);
  const who = escapeHtml(firstName(invoice.customer_name));
  const visit = invoice.details?.kind === 'reservation';
  const subject = visit
    ? t(`Paldies par apmeklējumu! Rēķins ${invoice.number} · SaimniekaPirts`, `Thank you for visiting! Invoice ${invoice.number} · SaimniekaPirts`)
    : t(`Rēķins ${invoice.number} · SaimniekaPirts`, `Invoice ${invoice.number} · SaimniekaPirts`);
  const body = [
    p(t(`Sveiki, ${who}!`, `Hello ${who},`)),
    visit
      ? p(t('Liels paldies, ka bijāt pie mums SaimniekaPirts! Ceram, ka pirts Jums sniedza atpūtu un spēku.',
        'Thank you so much for visiting SaimniekaPirts! We hope the sauna left you rested and renewed.'))
      : p(t('Paldies par dāvanu kartes pirkumu!', 'Thank you for buying a gift card!')),
    p(t(`Pielikumā ir rēķins Nr. ${invoice.number} par ${eur(invoice.total)}. Tas ir apmaksāts – nekas vairs nav jādara.`,
      `Attached is invoice ${invoice.number} for ${eur(invoice.total, 'en')}. It has been paid – there is nothing more you need to do.`)),
    visit ? h2(t('Mums ļoti palīdzētu Jūsu atsauksme', 'Your review would mean a lot to us')) : '',
    visit ? p(t('Ja Jums patika, lūdzu, veltiet minūti un uzrakstiet dažus vārdus Google. Tas palīdz citiem atrast SaimniekaPirts, un mums tas ir ļoti svarīgi.',
      'If you enjoyed your visit, please take a minute to write a few words on Google. It helps others find SaimniekaPirts, and it means a great deal to us.')) : '',
    visit ? button(REVIEW_URL, t('Uzrakstīt atsauksmi', 'Write a review')) : '',
    visit ? p(t('Būsiet gaidīti atkal! 🌿', 'You are always welcome back! 🌿')) : '',
  ].join('');
  const title = visit ? t('Paldies par apmeklējumu!', 'Thank you for visiting!') : t('Jūsu rēķins', 'Your invoice');
  const filename = `${lv ? 'Rekins' : 'Invoice'}-${invoice.number}.pdf`;
  return { subject, html: guestLayout(title, body, invoice.locale, invoice.seller), filename };
}

// ---------------------------------------------------------------------------
// Advance invoice to the office: a copy, since the guest has been sent it.

export const manageLink = (invoice: { id: string; manage_token: string }) =>
  `${MANAGE_URL}?id=${invoice.id}&t=${invoice.manage_token}`;

export function invoiceEmail(invoice: InvoiceRow & { manage_token?: string }) {
  const subject =
    `Avansa rēķins ${invoice.number} · ${invoice.customer_name} · ${visitLv(invoice.details)} · ${eur(invoice.total)}`;
  const lines = invoice.items
    .map((item) => {
      const qty = item.quantity > 1 ? ` × ${item.quantity}` : '';
      return `<tr><td style="padding:4px 12px 4px 0">${escapeHtml(item.name.lv)}${qty}</td>` +
        `<td style="padding:4px 0;text-align:right;white-space:nowrap">${eur(item.amount)}</td></tr>`;
    })
    .join('');
  const phone = invoice.customer_phone ? `, tālr. ${escapeHtml(invoice.customer_phone)}` : '';
  const link = invoice.manage_token ? manageLink({ id: invoice.id, manage_token: invoice.manage_token }) : '';
  const next = invoice.source_type === 'reservation'
    ? 'Gala rēķins klientam aizies automātiski nākamajā rītā pēc apmeklējuma un tiks saglabāts Google Drive.'
    : 'Kad dāvanu karte ir apmaksāta, izraksti gala rēķinu ar saiti zemāk – tas aizies klientam un tiks saglabāts Google Drive.';

  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;font-size:14px;color:#1a1a1a;line-height:1.5">
<div style="background:#eef6ee;border:1px solid #9cc79c;border-radius:6px;padding:12px 14px;margin-bottom:18px">
Avansa rēķins nosūtīts klientam uz
<a href="mailto:${escapeHtml(invoice.customer_email)}">${escapeHtml(invoice.customer_email)}</a>${phone}. Šī ir biroja kopija.
</div>
<p style="margin:0 0 4px"><strong>${escapeHtml(invoice.customer_name)}</strong></p>
<p style="margin:0 0 14px;color:#555">${escapeHtml(visitLv(invoice.details))} · avansa rēķins ${escapeHtml(invoice.number)} · apmaksāt līdz ${formatDate(invoice.due_on)}</p>
<table style="border-collapse:collapse;margin-bottom:6px">${lines}
<tr><td style="padding:8px 12px 4px 0;border-top:1px solid #ccc"><strong>Kopā</strong></td>
<td style="padding:8px 0 4px;border-top:1px solid #ccc;text-align:right"><strong>${eur(invoice.total)}</strong></td></tr></table>
<p style="margin:14px 0 0;color:#555">${next}</p>
${link ? `<p style="margin:26px 0 0;padding-top:12px;border-top:1px solid #ddd;color:#555;font-size:13px">Pārvaldība (vajadzīgs PIN): <a href="${link}">anulēt avansa rēķinu vai izrakstīt gala rēķinu</a>. Ja rezervācija tiek atcelta, anulē avansa rēķinu – tad gala rēķins netiks izrakstīts.</p>` : ''}
</body></html>`;

  const text = [
    'Avansa rēķins nosūtīts klientam uz ' +
      `${invoice.customer_email}${invoice.customer_phone ? `, tālr. ${invoice.customer_phone}` : ''}. Šī ir biroja kopija.`,
    '',
    invoice.customer_name,
    `${visitLv(invoice.details)} · avansa rēķins ${invoice.number} · apmaksāt līdz ${formatDate(invoice.due_on)}`,
    '',
    ...invoice.items.map((i) => `${i.name.lv}${i.quantity > 1 ? ` × ${i.quantity}` : ''}: ${eur(i.amount)}`),
    `Kopā: ${eur(invoice.total)}`,
    '',
    next,
    ...(link ? ['', `Pārvaldība (vajadzīgs PIN): ${link}`] : []),
  ].join('\n');

  const filename = `${invoice.locale === 'en' ? 'Advance-invoice' : 'Avansa-rekins'}-${invoice.number}.pdf`;
  return { subject, html, text, filename };
}

// ---------------------------------------------------------------------------
// The notice that a booking could not be priced.

export interface HoldNotice {
  sourceType: 'reservation' | 'gift_card';
  reason: string;
  fields: [string, string][];
}

export function holdEmail(notice: HoldNotice) {
  const name = notice.fields.find(([k]) => k === 'Vārds')?.[1] ?? '';
  const subject = `Rēķins jāizveido pašiem · ${name} · ${notice.sourceType === 'reservation' ? 'rezervācija' : 'dāvanu karte'}`;
  const rows = notice.fields
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:3px 14px 3px 0;color:#555">${escapeHtml(k)}</td><td style="padding:3px 0">${escapeHtml(v)}</td></tr>`)
    .join('');
  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;font-size:14px;color:#1a1a1a;line-height:1.5">
<div style="background:#fdecea;border:1px solid #e0a39c;border-radius:6px;padding:12px 14px;margin-bottom:18px">
<strong>Šim pasūtījumam rēķins netika izveidots</strong>, jo cenu nevarēja pārbaudīt pēc cenrāža.
Lūdzu, izrakstiet rēķinu pašrocīgi. Rēķina numurs netika izmantots.
</div>
<p style="margin:0 0 10px;color:#555">Iemesls: ${escapeHtml(notice.reason)}</p>
<table style="border-collapse:collapse">${rows}</table>
</body></html>`;
  const text = [
    'Šim pasūtījumam rēķins netika izveidots, jo cenu nevarēja pārbaudīt pēc cenrāža.',
    'Lūdzu, izrakstiet rēķinu pašrocīgi. Rēķina numurs netika izmantots.',
    '',
    `Iemesls: ${notice.reason}`,
    '',
    ...notice.fields.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`),
  ].join('\n');
  return { subject, html, text };
}
