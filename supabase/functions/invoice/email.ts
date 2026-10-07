// Every email this function writes.
//
// To the office (Latvian): a copy of each advance invoice with a link for
// annulling it; and the notice that a booking could not be priced.
//
// To guests (in the language they booked in: Latvian, English or Russian): the
// booking confirmation, then in a separate email the advance invoice, a
// reminder the day before the visit, and after the visit the final invoice
// with thanks and a request for a review.

import { formatDate, formatMoney, type InvoiceRow, type InvoiceDetails } from './pdf.ts';
import type { PricedOrder } from './pricing.ts';

type Locale = 'lv' | 'en' | 'ru';

// Picks the guest's language from the three versions of a sentence.
type Tr = (lv: string, en: string, ru: string) => string;
const translator = (locale: Locale): Tr => (lv, en, ru) => (locale === 'lv' ? lv : locale === 'ru' ? ru : en);

// Where guests find us and review us. The map link is the one the owner
// shares; Waze finds the gate when searched for by name.
export const MAP_URL = 'https://share.google/KE7fXPd8s220O9YdS';
export const WAZE_URL = 'https://waze.com/ul?q=saimniekapirts&navigate=yes';
export const BUS_URL = {
  lv: 'https://www.1188.lv/satiksme/saraksti/riga/dzimtmisa/200001/102628',
  en: 'https://www.1188.lv/en/transport/schedules/riga/dzimtmisa/200001/102628',
};
export const REVIEW_URL = 'https://www.google.com/maps?cid=15868172019720510571';
const LOGO_URL =
  'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/logo/logoTitle.png';
const MANAGE_URL = 'https://saimniekapirts.lv/rekins';

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

// Latvian and Russian write "1 234,00 €"; English "€1234.00".
const eur = (n: number | string, locale: Locale = 'lv') =>
  locale === 'en' ? `€${formatMoney(Number(n), 'en')}` : `${formatMoney(Number(n), 'lv')} €`;

const longDate = (iso: string, locale: Locale) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString(locale === 'lv' ? 'lv-LV' : locale === 'ru' ? 'ru-RU' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

const SAUNA_NAMES: Record<string, { en: string; ru: string }> = {
  'Baltā pirts': { en: 'White sauna', ru: 'Белая баня' },
  'Pelēkā pirts': { en: 'Grey sauna', ru: 'Серая баня' },
};
const saunaName = (sauna: string | undefined, locale: Locale) =>
  !sauna ? '' : locale === 'lv' ? sauna : SAUNA_NAMES[sauna]?.[locale] ?? sauna;

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? '';

const visitLv = (d: InvoiceDetails | null) =>
  d?.kind === 'reservation' && d.date
    ? [formatDate(d.date), d.time, d.sauna].filter(Boolean).join(', ')
    : 'dāvanu karte';

// ---------------------------------------------------------------------------
// Shared look for guest emails: a dark band with the logo, as on the website.

function guestLayout(title: string, body: string, locale: Locale, seller: InvoiceRow['seller']) {
  const signOff = translator(locale)('Ar cieņu', 'Kind regards', 'С уважением');
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

// An invoice line's name in the guest's language; lines priced before Russian
// came in have no Russian name and fall back to English.
const itemName = (name: { lv: string; en: string; ru?: string }, locale: Locale) =>
  locale === 'ru' ? name.ru ?? name.en : name[locale];

function detailsTable(rows: [string, string][], priced: PricedOrder | null, locale: Locale) {
  const t = translator(locale);
  const line = (k: string, v: string, strong = false) =>
    `<tr><td style="padding:5px 16px 5px 0;color:#555;font-size:14px;vertical-align:top">${k}</td><td style="padding:5px 0;font-size:15px;${strong ? 'font-weight:bold' : ''}">${v}</td></tr>`;
  let html = rows.filter(([, v]) => v).map(([k, v]) => line(escapeHtml(k), escapeHtml(v))).join('');
  if (priced && priced.items.length) {
    const items = priced.items
      .map((i) => `${escapeHtml(itemName(i.name, locale))}${i.quantity > 1 ? ` × ${i.quantity}` : ''} – ${eur(i.amount, locale)}`)
      .join('<br>');
    html += line(t('Pakalpojumi', 'Services', 'Услуги'), items);
    html += priced.problems.length === 0
      ? line(t('Kopā', 'Total', 'Итого'), eur(priced.total, locale), true)
      : line(t('Kopā', 'Total', 'Итого'), t('precizēsim', 'to be confirmed', 'уточним'), true);
  }
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#f6f8f6;border-radius:8px;padding:10px 16px;margin:0 0 16px">${html}</table>`;
}

const link = (href: string, text: string) => `<a href="${href}" style="color:#2e7d32">${text}</a>`;

// Directions, in the confirmation and again in the reminder.
const findUs = (t: Tr) =>
  h2(t('Kā pie mums nokļūt', 'How to find us', 'Как нас найти')) +
  p(t(`Adrese: "Sarma Nr. 123", Baldones pagasts, Ķekavas novads, LV-2125.`,
    `Address: "Sarma Nr. 123", Baldone parish, Ķekava municipality, LV-2125, Latvia.`,
    `Адрес: «Sarma Nr. 123», Балдонская волость, Кекавский край, LV-2125.`)) +
  p(t(`Atrašanās vieta kartē: ${link(MAP_URL, 'atvērt Google Maps')}. Waze lietotnē meklējiet <strong>"saimniekapirts"</strong> – tā atvedīs līdz pašiem vārtiem (${link(WAZE_URL, 'atvērt Waze')}). Teritorijā ir plaša privāta autostāvvieta.`,
    `Location on the map: ${link(MAP_URL, 'open Google Maps')}. In Waze, search for <strong>"saimniekapirts"</strong> – it takes you right to the gate (${link(WAZE_URL, 'open Waze')}). There is plenty of private parking on site.`,
    `Мы на карте: ${link(MAP_URL, 'открыть Google Maps')}. В Waze ищите <strong>«saimniekapirts»</strong> – навигатор приведёт прямо к воротам (${link(WAZE_URL, 'открыть Waze')}). На территории – просторная частная парковка.`)) +
  p(t(`No Rīgas var atbraukt ar autobusu līdz pieturai <strong>"Dzimtmisa"</strong> (${link(BUS_URL.lv, 'autobusu saraksts')}) – tur Jūs savāksim bez maksas; atbildiet uz šo e-pastu un pasakiet, ar kuru reisu brauksiet. Ir arī transfērs no Rīgas un atpakaļ – 60 € līdz 4 cilvēkiem, 120 € līdz 8 cilvēkiem; lielākām grupām cena pēc vienošanās.`,
    `From Riga you can take the bus to the <strong>"Dzimtmisa"</strong> stop (${link(BUS_URL.en, 'bus timetable')}) – we collect you there free of charge; reply to this email and tell us which bus you will take. There is also a transfer from Riga and back – €60 for up to 4 people, €120 for up to 8; for larger groups the price is agreed separately.`,
    `Из Риги можно доехать на автобусе до остановки <strong>«Dzimtmisa»</strong> (${link(BUS_URL.lv, 'расписание автобусов')}) – там мы вас бесплатно встретим; ответьте на это письмо и напишите, каким рейсом поедете. Есть и трансфер из Риги и обратно – 60 € до 4 человек, 120 € до 8 человек; для больших групп цена по договорённости.`));

const whatToBring = (t: Tr, ritual: boolean) =>
  h2(ritual
    ? t('Kas ir iekļauts un ko ņemt līdzi', 'What is included and what to bring', 'Что включено и что взять с собой')
    : t('Ko ņemt līdzi', 'What to bring', 'Что взять с собой')) +
  list(ritual
    ? [
        t('Iekļauts: dvieļi, lina dvieļi, pirts cepures un halāti.', 'Included: towels, linen sheets, sauna hats and bathrobes.',
          'Включено: полотенца, льняные простыни, банные шапки и халаты.'),
        t('Paņemiet līdzi gumijas vai baseina čības.', 'Bring rubber or pool slippers.', 'Возьмите резиновые тапочки или тапочки для бассейна.'),
        t('Dienu iepriekš un rituāla dienā dzeriet daudz ūdens; dienu iepriekš ieteicams vieglāks ēdiens bez gaļas.',
          'Drink plenty of water the day before and on the day; a lighter meal without meat the day before is best.',
          'Накануне и в день ритуала пейте больше воды; накануне лучше лёгкая еда без мяса.'),
        t('Pirms rituāla pastāstiet pirtniekam par savu veselību, alerģijām un lietotajiem medikamentiem.',
          'Before the ritual, tell the sauna master about your health, any allergies and medication.',
          'Перед ритуалом расскажите пармастеру о своём здоровье, аллергиях и принимаемых лекарствах.'),
        t('Savu ēdienu drīkst ņemt līdzi. Alkohols un citas apreibinošas vielas teritorijā nav atļautas.',
          'You are welcome to bring your own food. Alcohol and other intoxicants are not allowed on the premises.',
          'Свою еду можно взять с собой. Алкоголь и другие одурманивающие вещества на территории запрещены.'),
      ]
    : [
        t('Dvieļus var izīrēt uz vietas – 4 € par dvieli – vai paņemt savus.', 'Towels can be rented on site for €4 each, or bring your own.',
          'Полотенца можно взять напрокат на месте – 4 € за полотенце – или привезти свои.'),
        t('Paņemiet līdzi gumijas vai baseina čības.', 'Bring rubber or pool slippers.', 'Возьмите резиновые тапочки или тапочки для бассейна.'),
        t('Savu ēdienu drīkst ņemt līdzi. Alkohols un citas apreibinošas vielas teritorijā nav atļautas.',
          'You are welcome to bring your own food. Alcohol and other intoxicants are not allowed on the premises.',
          'Свою еду можно взять с собой. Алкоголь и другие одурманивающие вещества на территории запрещены.'),
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
  transport?: string;
  cash?: boolean;
  // Paid by card through Stripe before the confirmation went out.
  card?: boolean;
  priced: PricedOrder;
  individual?: boolean;
  seller: InvoiceRow['seller'];
}

export function confirmationEmail(c: ConfirmationInput) {
  const who = escapeHtml(firstName(c.name));
  const t = translator(c.locale);

  if (c.type === 'gift_card') {
    const subject = t('Dāvanu kartes pasūtījums saņemts · SaimniekaPirts', 'Gift card order received · SaimniekaPirts',
      'Заказ подарочной карты получен · SaimniekaPirts');
    const body = [
      p(t(`Sveiki, ${who}!`, `Hello ${who},`, `Здравствуйте, ${who}!`)),
      p(t('Paldies par dāvanu kartes pasūtījumu! Tā ir lieliska dāvana – pirts rituāls, ko atceras ilgi.',
        'Thank you for ordering a gift card – a sauna ritual is a gift people remember for a long time.',
        'Спасибо за заказ подарочной карты! Это прекрасный подарок – банный ритуал запоминается надолго.')),
      detailsTable([], c.priced, c.locale),
      h2(t('Kas notiks tālāk', 'What happens next', 'Что дальше')),
      list([
        t('Rēķinu apmaksai nosūtām atsevišķā e-pastā – tas pienāks pēc dažām minūtēm.', 'The invoice for payment follows in a separate email within a few minutes.',
          'Счёт для оплаты придёт отдельным письмом через несколько минут.'),
        t('Pēc apmaksas sagatavosim un nosūtīsim dāvanu karti.', 'Once it is paid, we will prepare the gift card and send it to you.',
          'После оплаты мы подготовим и пришлём подарочную карту.'),
        t('Dāvanu karte ir derīga vienu gadu. Ja nepieciešams, termiņu varam pagarināt.', 'The gift card is valid for one year, and we can extend it if needed.',
          'Подарочная карта действительна один год. При необходимости срок можно продлить.'),
      ]),
      p(t('Ja rodas jautājumi, zvaniet vai rakstiet – labprāt palīdzēsim.', 'If you have any questions, call or write – we are happy to help.',
        'Если появятся вопросы, звоните или пишите – с радостью поможем.')),
    ].join('');
    return { subject, html: guestLayout(t('Pasūtījums saņemts', 'Order received', 'Заказ получен'), body, c.locale, c.seller) };
  }

  const ritual = c.formType === 'ritual';
  const dateText = c.date ? longDate(c.date, c.locale) : '';
  const subject = t(
    `Rezervācija apstiprināta: ${ritual ? 'pirts rituāls' : 'pirts noma'} ${c.date ? formatDate(c.date) : ''} plkst. ${c.time ?? ''} · SaimniekaPirts`,
    `Booking confirmed: ${ritual ? 'sauna ritual' : 'sauna rental'} on ${c.date ? formatDate(c.date) : ''} at ${c.time ?? ''} · SaimniekaPirts`,
    `Бронирование подтверждено: ${ritual ? 'банный ритуал' : 'аренда бани'} ${c.date ? formatDate(c.date) : ''} в ${c.time ?? ''} · SaimniekaPirts`,
  );
  const duration = ritual
    ? (c.individual
      ? t('Individuālais rituāls ilgst līdz 3 stundām.', 'An individual ritual lasts up to 3 hours.', 'Индивидуальный ритуал длится до 3 часов.')
      : t('Rituāls ilgst līdz 4 stundām.', 'The ritual lasts up to 4 hours.', 'Ритуал длится до 4 часов.'))
    : '';

  const body = [
    p(t(`Sveiki, ${who}!`, `Hello ${who},`, `Здравствуйте, ${who}!`)),
    p(ritual
      ? t('Paldies, ka izvēlējāties SaimniekaPirts! Jūsu pirts rituāls ir rezervēts, un mēs jau gatavojamies Jūs sagaidīt.',
        'Thank you for choosing SaimniekaPirts! Your sauna ritual is booked and we are looking forward to welcoming you.',
        'Спасибо, что выбрали SaimniekaPirts! Ваш банный ритуал забронирован, и мы уже готовимся вас встретить.')
      : t('Paldies, ka izvēlējāties SaimniekaPirts! Jūsu pirts noma ir rezervēta.',
        'Thank you for choosing SaimniekaPirts! Your sauna rental is booked.',
        'Спасибо, что выбрали SaimniekaPirts! Аренда бани забронирована.')),
    replyBox(t('<strong>Lūdzu, atbildiet uz šo e-pastu</strong> (pietiek ar vārdu "Saņemts"), lai mēs zinātu, ka rezervācijas apstiprinājums Jūs ir sasniedzis.',
      '<strong>Please reply to this email</strong> (just "Received" is enough) so we know the confirmation has reached you.',
      '<strong>Пожалуйста, ответьте на это письмо</strong> (достаточно слова «Получено»), чтобы мы знали, что подтверждение до вас дошло.')),
    h2(t('Jūsu rezervācija', 'Your booking', 'Ваше бронирование')),
    detailsTable([
      [t('Datums', 'Date', 'Дата'), dateText],
      [t('Sākuma laiks', 'Start time', 'Начало'), c.time ?? ''],
      [t('Pirts', 'Sauna', 'Баня'), saunaName(c.sauna, c.locale)],
      [t('Personu skaits', 'Number of people', 'Количество человек'), c.participants ? String(c.participants) : ''],
      [t('Nakšņošana', 'Overnight stay', 'Ночёвка'), c.overnight ? t('jā', 'yes', 'да') : ''],
      [t('Transports', 'Transport', 'Транспорт'), c.transport ?? ''],
    ], c.priced, c.locale),
    duration ? p(duration) : '',
    findUs(t),
    whatToBring(t, ritual),
    h2(t('Apmaksa', 'Payment', 'Оплата')),
    p(c.card
      ? t('Apmaksa ar karti ir saņemta – paldies! Rēķinu nosūtām atsevišķā e-pastā.', 'Your card payment has been received – thank you! The invoice follows in a separate email.',
        'Оплата картой получена – спасибо! Счёт придёт отдельным письмом.')
      : c.cash
      ? t('Norēķināties varēsiet skaidrā naudā uz vietas pēc apmeklējuma.', 'You will pay in cash on site after your visit.',
        'Оплатить можно наличными на месте после визита.')
      : t('Avansa rēķinu nosūtām atsevišķā e-pastā – lūdzam to apmaksāt ar pārskaitījumu pirms apmeklējuma. Ja ērtāk, var norēķināties arī skaidrā naudā uz vietas.',
        'The advance invoice follows in a separate email – please pay it by bank transfer before your visit. If you prefer, you can also pay in cash on site.',
        'Счёт на предоплату придёт отдельным письмом – пожалуйста, оплатите его переводом до визита. Если удобнее, можно расплатиться и наличными на месте.')),
    h2(t('Izmaiņas un atcelšana', 'Changes and cancellation', 'Изменения и отмена')),
    p(t(`Rezervāciju var pārcelt vai atcelt bez maksas. Lūdzu, paziņojiet pēc iespējas agrāk – zvaniet ${callUs} vai atbildiet uz šo e-pastu.`,
      `You can move or cancel your booking free of charge. Please let us know as early as you can – call ${callUs} or reply to this email.`,
      `Бронирование можно перенести или отменить бесплатно. Пожалуйста, сообщите как можно раньше – позвоните ${callUs} или ответьте на это письмо.`)),
    p(t('Gaidīsim Jūs! 🌿', 'We look forward to seeing you! 🌿', 'Ждём вас! 🌿')),
  ].join('');

  return { subject, html: guestLayout(t('Rezervācija apstiprināta', 'Your booking is confirmed', 'Бронирование подтверждено'), body, c.locale, c.seller) };
}

// ---------------------------------------------------------------------------
// Reminder to the guest, the day before the visit.

export function reminderEmail(c: ConfirmationInput) {
  const who = escapeHtml(firstName(c.name));
  const t = translator(c.locale);
  const ritual = c.formType === 'ritual';
  const when = c.date ? longDate(c.date, c.locale) : '';
  const subject = t(
    `Atgādinājums: rīt plkst. ${c.time ?? ''} ${ritual ? 'pirts rituāls' : 'pirts noma'} · SaimniekaPirts`,
    `Reminder: your ${ritual ? 'sauna ritual' : 'sauna rental'} tomorrow at ${c.time ?? ''} · SaimniekaPirts`,
    `Напоминание: завтра в ${c.time ?? ''} ${ritual ? 'банный ритуал' : 'аренда бани'} · SaimniekaPirts`,
  );
  const body = [
    p(t(`Sveiki, ${who}!`, `Hello ${who},`, `Здравствуйте, ${who}!`)),
    p(ritual
      ? t(`Atgādinām, ka rīt, <strong>${when}, plkst. ${c.time ?? ''}</strong>, Jūs gaida pirts rituāls SaimniekaPirts. Mēs jau gatavojam pirti!`,
        `A reminder that your sauna ritual at SaimniekaPirts is tomorrow, <strong>${when}, at ${c.time ?? ''}</strong>. We are getting the sauna ready!`,
        `Напоминаем: завтра, <strong>${when}, в ${c.time ?? ''}</strong>, вас ждёт банный ритуал в SaimniekaPirts. Мы уже готовим баню!`)
      : t(`Atgādinām, ka rīt, <strong>${when}, plkst. ${c.time ?? ''}</strong>, Jūs gaida pirts noma SaimniekaPirts.`,
        `A reminder that your sauna rental at SaimniekaPirts is tomorrow, <strong>${when}, at ${c.time ?? ''}</strong>.`,
        `Напоминаем: завтра, <strong>${when}, в ${c.time ?? ''}</strong>, вас ждёт аренда бани в SaimniekaPirts.`)),
    detailsTable([
      [t('Sākuma laiks', 'Start time', 'Начало'), c.time ?? ''],
      [t('Pirts', 'Sauna', 'Баня'), saunaName(c.sauna, c.locale)],
      [t('Personu skaits', 'Number of people', 'Количество человек'), c.participants ? String(c.participants) : ''],
      [t('Nakšņošana', 'Overnight stay', 'Ночёвка'), c.overnight ? t('jā', 'yes', 'да') : ''],
      [t('Transports', 'Transport', 'Транспорт'), c.transport ?? ''],
    ], null, c.locale),
    findUs(t),
    whatToBring(t, ritual),
    h2(t('Apmaksa', 'Payment', 'Оплата')),
    p(c.card
      ? t('Apmaksa jau ir saņemta – paldies!', 'Your payment has already been received – thank you!', 'Оплата уже получена – спасибо!')
      : c.cash
      ? t('Norēķināties varēsiet skaidrā naudā uz vietas pēc apmeklējuma.', 'You will pay in cash on site after your visit.',
        'Оплатить можно наличными на месте после визита.')
      : t('Ja avansa rēķins vēl nav apmaksāts, var norēķināties arī skaidrā naudā uz vietas.',
        'If the advance invoice has not been paid yet, you can also pay in cash on site.',
        'Если счёт на предоплату ещё не оплачен, можно расплатиться наличными на месте.')),
    h2(t('Ja plāni mainījušies', 'If your plans have changed', 'Если планы изменились')),
    p(t(`Lūdzu, paziņojiet mums pēc iespējas ātrāk – zvaniet ${callUs} vai atbildiet uz šo e-pastu.`,
      `Please let us know as soon as possible – call ${callUs} or reply to this email.`,
      `Пожалуйста, сообщите нам как можно скорее – позвоните ${callUs} или ответьте на это письмо.`)),
    p(t('Uz tikšanos rīt! 🌿', 'See you tomorrow! 🌿', 'До встречи завтра! 🌿')),
  ].join('');
  return { subject, html: guestLayout(t('Uz tikšanos rīt!', 'See you tomorrow!', 'До встречи завтра!'), body, c.locale, c.seller) };
}

// ---------------------------------------------------------------------------
// Advance invoice to the guest, straight after the confirmation. When the
// office sends it with a payment link, it offers paying by card as well.

// Why a gift card given when booking did not hold, in the guest's words.
export function giftCardReason(reason: string, locale: Locale) {
  const t = translator(locale);
  switch (reason) {
    case 'not_found': return t('šāds kartes numurs netika atrasts', 'no card with this number was found', 'карта с таким номером не найдена');
    case 'wrong_code': return t('kartes kods nesakrīt', 'the card code does not match', 'код карты не совпадает');
    case 'locked': return t('karte ir bloķēta pēc vairākiem nepareiziem kodiem', 'the card is locked after several wrong codes', 'карта заблокирована после нескольких неверных кодов');
    case 'not_paid': return t('karte vēl nav apmaksāta', 'the card has not been paid for yet', 'карта ещё не оплачена');
    case 'cancelled': return t('karte ir atcelta', 'the card has been cancelled', 'карта аннулирована');
    case 'expired': return t('kartes derīgums beidzas pirms apmeklējuma', 'the card expires before the visit', 'срок действия карты истекает до визита');
    case 'used': return t('karte jau izmantota citai rezervācijai', 'the card has already been used for another booking', 'карта уже использована для другого бронирования');
    default: return t('nezināms iemesls', 'an unknown reason', 'неизвестная причина');
  }
}

// For the office: the gift card taken off a booking, or one that did not hold.
export function giftCardOfficeNote(invoice: InvoiceRow) {
  const d = invoice.details;
  if (d?.gift_card) {
    return d.payment === 'gift_card'
      ? `Klients rezervēja ar dāvanu karti Nr. ${d.gift_card} – tā sedz visu rezervāciju.`
      : `Klients rezervēja ar dāvanu karti Nr. ${d.gift_card} – tā ieskaitīta, rēķinā atlikusī summa.`;
  }
  if (d?.gift_card_problem) {
    return `Klients norādīja dāvanu karti Nr. ${d.gift_card_problem.code}, bet to neizdevās ieskaitīt: ${giftCardReason(d.gift_card_problem.reason, 'lv')}. Rēķins izrakstīts pilnā apmērā – sazinieties ar klientu (ja karte derīga, piemērojiet atlaidi vai izrakstiet rēķinu no jauna).`;
  }
  return '';
}

// The PDF's file name, in the guest's language.
const fileName = (kind: 'advance' | 'final', locale: Locale, number: string) =>
  `${kind === 'advance'
    ? translator(locale)('Avansa-rekins', 'Advance-invoice', 'Schet-na-predoplatu')
    : translator(locale)('Rekins', 'Invoice', 'Schet')}-${number}.pdf`;

export function advanceInvoiceGuestEmail(invoice: InvoiceRow, payUrl?: string) {
  const locale = invoice.locale;
  const t = translator(locale);
  const who = escapeHtml(firstName(invoice.customer_name));
  const d = invoice.details;
  const visit = d?.kind === 'reservation';
  const seller = invoice.seller;
  const what = visit && d?.date
    ? t(`par apmeklējumu ${formatDate(d.date)} plkst. ${d.time ?? ''}`, `for your visit on ${formatDate(d.date)} at ${d.time ?? ''}`,
      `за визит ${formatDate(d.date)} в ${d.time ?? ''}`)
    : t('par dāvanu karti', 'for your gift card', 'за подарочную карту');
  const subject = t(`Avansa rēķins ${invoice.number} · SaimniekaPirts`, `Advance invoice ${invoice.number} · SaimniekaPirts`,
    `Счёт на предоплату ${invoice.number} · SaimniekaPirts`);
  const filename = fileName('advance', locale, invoice.number);
  const card = escapeHtml(d?.gift_card ?? '');
  if (d?.payment === 'gift_card') {
    const covered = [
      p(t(`Sveiki, ${who}!`, `Hello ${who},`, `Здравствуйте, ${who}!`)),
      p(t(`Jūsu apmeklējums ${what} ir pilnībā apmaksāts ar dāvanu karti Nr. ${card} – nekas nav jāmaksā. Pielikumā ir rēķins Nr. ${invoice.number}.`,
        `Your visit ${what} is paid in full with gift card no. ${card} – there is nothing to pay. Attached is invoice ${invoice.number}.`,
        `Ваш визит ${what} полностью оплачен подарочной картой № ${card} – платить ничего не нужно. Во вложении счёт № ${invoice.number}.`)),
      p(t('Ierodoties paņemiet līdzi dāvanu karti – izdrukātu vai telefonā. Gaidīsim Jūs! 🌿',
        'Please bring the gift card along – printed or on your phone. We look forward to seeing you! 🌿',
        'Возьмите с собой подарочную карту – распечатанную или в телефоне. Ждём вас! 🌿')),
    ].join('');
    return {
      subject: t(`Apmaksāts ar dāvanu karti · rēķins ${invoice.number} · SaimniekaPirts`, `Paid with your gift card · invoice ${invoice.number} · SaimniekaPirts`,
        `Оплачено подарочной картой · счёт ${invoice.number} · SaimniekaPirts`),
      html: guestLayout(t('Apmaksāts ar dāvanu karti', 'Paid with your gift card', 'Оплачено подарочной картой'), covered, locale, seller),
      filename,
    };
  }
  if (d?.payment === 'card') {
    const paid = [
      p(t(`Sveiki, ${who}!`, `Hello ${who},`, `Здравствуйте, ${who}!`)),
      p(t(`Paldies, apmaksa ar karti ir saņemta! Pielikumā ir rēķins Nr. ${invoice.number} ${what} par ${eur(invoice.total)}. Tas ir apmaksāts – nekas vairs nav jādara.`,
        `Thank you, your card payment has been received! Attached is invoice ${invoice.number} ${what} for ${eur(invoice.total, 'en')}. It has been paid – there is nothing more you need to do.`,
        `Спасибо, оплата картой получена! Во вложении счёт № ${invoice.number} ${what} на сумму ${eur(invoice.total, 'ru')}. Он оплачен – больше ничего делать не нужно.`)),
      p(t('Gaidīsim Jūs! 🌿', 'We look forward to seeing you! 🌿', 'Ждём вас! 🌿')),
    ].join('');
    return {
      subject: t(`Apmaksa saņemta · rēķins ${invoice.number} · SaimniekaPirts`, `Payment received · invoice ${invoice.number} · SaimniekaPirts`,
        `Оплата получена · счёт ${invoice.number} · SaimniekaPirts`),
      html: guestLayout(t('Apmaksa saņemta', 'Payment received', 'Оплата получена'), paid, locale, seller),
      filename,
    };
  }
  const problem = d?.gift_card_problem;
  const body = [
    p(t(`Sveiki, ${who}!`, `Hello ${who},`, `Здравствуйте, ${who}!`)),
    p(t(`Pielikumā ir avansa rēķins Nr. ${invoice.number} ${what}.`, `Attached is advance invoice ${invoice.number} ${what}.`,
      `Во вложении счёт на предоплату № ${invoice.number} ${what}.`)),
    d?.gift_card ? p(t(`Dāvanu karte Nr. ${card} ir ieskaitīta – rēķinā ir tikai atlikusī summa.`,
      `Gift card no. ${card} has been applied – the invoice is for the rest only.`,
      `Подарочная карта № ${card} учтена – в счёте только оставшаяся сумма.`)) : '',
    problem ? p(t(`Dāvanu karti Nr. ${escapeHtml(problem.code)} neizdevās ieskaitīt automātiski (${giftCardReason(problem.reason, 'lv')}). Neuztraucieties – zvaniet +371 26 752 661 vai rakstiet uz info@saimniekapirts.lv, un mēs to nokārtosim; pagaidām šo rēķinu nemaksājiet.`,
      `We could not apply gift card no. ${escapeHtml(problem.code)} automatically (${giftCardReason(problem.reason, 'en')}). Don't worry – call +371 26 752 661 or write to info@saimniekapirts.lv and we will sort it out; please hold off paying this invoice for now.`,
      `Подарочную карту № ${escapeHtml(problem.code)} не удалось учесть автоматически (${giftCardReason(problem.reason, 'ru')}). Не волнуйтесь – позвоните +371 26 752 661 или напишите на info@saimniekapirts.lv, и мы всё уладим; пока не оплачивайте этот счёт.`)) : '',
    d?.replaces ? p(t(`Tas aizstāj iepriekš nosūtīto rēķinu Nr. ${escapeHtml(d.replaces)}, kas ir anulēts – lūdzu, maksājiet pēc šī rēķina.`,
      `It replaces invoice ${escapeHtml(d.replaces)} sent earlier, which has been annulled – please pay this one instead.`,
      `Он заменяет ранее отправленный счёт № ${escapeHtml(d.replaces)}, который аннулирован, – пожалуйста, оплачивайте по этому счёту.`)) : '',
    payUrl ? p(t(`Rēķinu var apmaksāt ar karti tiešsaistē – ${eur(invoice.total)}:`, `You can pay it by card online – ${eur(invoice.total, 'en')}:`,
      `Счёт можно оплатить картой онлайн – ${eur(invoice.total, 'ru')}:`)) : '',
    payUrl ? button(payUrl, t('Maksāt ar karti', 'Pay by card', 'Оплатить картой')) : '',
    payUrl ? p(t('Vai ar pārskaitījumu:', 'Or by bank transfer:', 'Или банковским переводом:')) : '',
    detailsTable([
      [t('Summa', 'Amount', 'Сумма'), eur(invoice.total, locale)],
      [t('Apmaksāt līdz', 'Due by', 'Оплатить до'), formatDate(invoice.due_on)],
      [t('Saņēmējs', 'Payee', 'Получатель'), seller.name],
      [t('Konts', 'Account (IBAN)', 'Счёт (IBAN)'), seller.iban],
      [t('Banka', 'Bank', 'Банк'), `${seller.bank}, SWIFT ${seller.swift}`],
      [t('Maksājuma mērķis', 'Payment reference', 'Назначение платежа'), invoice.number],
    ], null, locale),
    visit
      ? p(t('Ja ērtāk, var norēķināties arī skaidrā naudā uz vietas.', 'If you prefer, you can also pay in cash on site.',
        'Если удобнее, можно расплатиться и наличными на месте.'))
      : p(t('Pēc apmaksas sagatavosim un nosūtīsim dāvanu karti.', 'Once it is paid, we will prepare the gift card and send it to you.',
        'После оплаты мы подготовим и пришлём подарочную карту.')),
    p(visit ? t('Gaidīsim Jūs! 🌿', 'We look forward to seeing you! 🌿', 'Ждём вас! 🌿')
      : t('Paldies par pasūtījumu! 🌿', 'Thank you for your order! 🌿', 'Спасибо за заказ! 🌿')),
  ].join('');
  return { subject, html: guestLayout(t('Avansa rēķins', 'Advance invoice', 'Счёт на предоплату'), body, locale, seller), filename };
}

// The review request, at the end of the thanks and of the final invoice.
const reviewRequest = (t: Tr) => [
  h2(t('Mums ļoti palīdzētu Jūsu atsauksme', 'Your review would mean a lot to us', 'Нам очень поможет ваш отзыв')),
  p(t('Ja Jums patika, lūdzu, veltiet minūti un uzrakstiet dažus vārdus Google. Tas palīdz citiem atrast SaimniekaPirts, un mums tas ir ļoti svarīgi.',
    'If you enjoyed your visit, please take a minute to write a few words on Google. It helps others find SaimniekaPirts, and it means a great deal to us.',
    'Если вам понравилось, пожалуйста, уделите минуту и напишите пару слов в Google. Это помогает другим найти SaimniekaPirts, и для нас это очень важно.')),
  button(REVIEW_URL, t('Uzrakstīt atsauksmi', 'Write a review', 'Написать отзыв')),
  p(t('Būsiet gaidīti atkal! 🌿', 'You are always welcome back! 🌿', 'Будем рады видеть вас снова! 🌿')),
].join('');

// ---------------------------------------------------------------------------
// Thanks the morning after the visit, for a guest who paid in cash and so gets
// no final invoice: the same words, without the invoice.

export function thanksEmail(c: ConfirmationInput) {
  const t = translator(c.locale);
  const who = escapeHtml(firstName(c.name));
  const subject = t('Paldies par apmeklējumu! · SaimniekaPirts', 'Thank you for visiting! · SaimniekaPirts', 'Спасибо за визит! · SaimniekaPirts');
  const body = [
    p(t(`Sveiki, ${who}!`, `Hello ${who},`, `Здравствуйте, ${who}!`)),
    p(t('Liels paldies, ka bijāt pie mums SaimniekaPirts un uzticējāties mums! Ceram, ka pirts Jums sniedza atpūtu un spēku.',
      'Thank you so much for visiting SaimniekaPirts and trusting us with your time! We hope the sauna left you rested and renewed.',
      'Большое спасибо, что побывали у нас в SaimniekaPirts и доверились нам! Надеемся, баня подарила вам отдых и новые силы.')),
    reviewRequest(t),
  ].join('');
  return { subject, html: guestLayout(t('Paldies par apmeklējumu!', 'Thank you for visiting!', 'Спасибо за визит!'), body, c.locale, c.seller) };
}

// ---------------------------------------------------------------------------
// Final invoice to the guest.

export interface GiftCardNote {
  code: string;
  // Asked for with the number when booking online.
  pin?: string;
  validUntil: string;
  // A ritual card is attached as the card and as the A4 card.
  kind?: 'value' | 'ritual';
}

// For a gift card, the final invoice travels with the gift card itself.
export function finalInvoiceGuestEmail(invoice: InvoiceRow, giftCard?: GiftCardNote) {
  const locale = invoice.locale;
  const t = translator(locale);
  const who = escapeHtml(firstName(invoice.customer_name));
  const visit = invoice.details?.kind === 'reservation';
  const filename = fileName('final', locale, invoice.number);
  const bookUrl = `https://saimniekapirts.lv${t('', '/en', '/ru')}/rezervet`;
  if (!visit && giftCard) {
    const card = escapeHtml(giftCard.code);
    const valid = formatDate(giftCard.validUntil);
    const pin = giftCard.pin ? escapeHtml(giftCard.pin) : '';
    const email = `<a href="mailto:${invoice.seller.email}" style="color:#2e7d32">${invoice.seller.email}</a>`;
    const body = [
      p(t(`Sveiki, ${who}!`, `Hello ${who},`, `Здравствуйте, ${who}!`)),
      p(t('Paldies par dāvanu kartes pirkumu! Pielikumā ir:', 'Thank you for buying a gift card! Attached are:', 'Спасибо за покупку подарочной карты! Во вложении:')),
      list([
        giftCard.kind === 'value'
          ? t(`<strong>dāvanu karte Nr. ${card}</strong>, derīga līdz ${valid}, divos variantos. Dāviniet to, kurš Jums labāk patīk: to var izdrukāt vai uzdāvināt elektroniski;`,
            `<strong>gift card no. ${card}</strong>, valid until ${valid}, in two versions. Give whichever you like: print it or give it electronically;`,
            `<strong>подарочная карта № ${card}</strong>, действительна до ${valid}, в двух вариантах. Подарите тот, что вам больше нравится: её можно распечатать или подарить в электронном виде;`)
          : t(`<strong>dāvanu karte Nr. ${card}</strong>, derīga līdz ${valid}, trīs variantos – divas kartes un A4 formātā. Dāviniet to, kurš Jums labāk patīk: to var izdrukāt vai uzdāvināt elektroniski;`,
            `<strong>gift card no. ${card}</strong>, valid until ${valid}, in three versions – two cards and an A4 page. Give whichever you like: print it or give it electronically;`,
            `<strong>подарочная карта № ${card}</strong>, действительна до ${valid}, в трёх вариантах – две карты и формат A4. Подарите тот, что вам больше нравится: её можно распечатать или подарить в электронном виде;`),
        t(`rēķins Nr. ${invoice.number} par ${eur(invoice.total)} – tas ir apmaksāts.`, `invoice ${invoice.number} for ${eur(invoice.total, 'en')} – it has been paid.`,
          `счёт № ${invoice.number} на сумму ${eur(invoice.total, 'ru')} – он оплачен.`),
      ]),
      h2(t('Kā izmantot dāvanu karti', 'How to use the gift card', 'Как воспользоваться подарочной картой')),
      p(t(`Rezervējiet laiku ${link(bookUrl, 'saimniekapirts.lv/rezervet')} un ievadiet kartes numuru${pin ? ` un kodu <strong>${pin}</strong>` : ' un kodu'} – karte tiks ieskaitīta automātiski. Vai zvaniet ${callUs}, rakstiet uz ${email} un nosauciet dāvanu kartes numuru.`,
        `Book online at ${link(bookUrl, 'saimniekapirts.lv/rezervet')} with the card number${pin ? ` and code <strong>${pin}</strong>` : ' and code'} – the card is applied automatically. Or call ${callUs} or write to ${email}, quoting the gift card number.`,
        `Забронируйте время на ${link(bookUrl, 'saimniekapirts.lv/rezervet')} и введите номер карты${pin ? ` и код <strong>${pin}</strong>` : ' и код'} – карта будет учтена автоматически. Или позвоните ${callUs}, напишите на ${email} и назовите номер подарочной карты.`)),
      p(t('Lai dāvana sagādā prieku! 🌿', 'We hope the gift brings a lot of joy! 🌿', 'Пусть подарок принесёт радость! 🌿')),
    ].join('');
    return {
      subject: t(`Jūsu dāvanu karte ${giftCard.code} · SaimniekaPirts`, `Your gift card ${giftCard.code} · SaimniekaPirts`,
        `Ваша подарочная карта ${giftCard.code} · SaimniekaPirts`),
      html: guestLayout(t('Jūsu dāvanu karte', 'Your gift card', 'Ваша подарочная карта'), body, locale, invoice.seller),
      filename,
    };
  }
  const subject = visit
    ? t(`Paldies par apmeklējumu! Rēķins ${invoice.number} · SaimniekaPirts`, `Thank you for visiting! Invoice ${invoice.number} · SaimniekaPirts`,
      `Спасибо за визит! Счёт ${invoice.number} · SaimniekaPirts`)
    : t(`Rēķins ${invoice.number} · SaimniekaPirts`, `Invoice ${invoice.number} · SaimniekaPirts`, `Счёт ${invoice.number} · SaimniekaPirts`);
  const body = [
    p(t(`Sveiki, ${who}!`, `Hello ${who},`, `Здравствуйте, ${who}!`)),
    visit
      ? p(t('Liels paldies, ka bijāt pie mums SaimniekaPirts! Ceram, ka pirts Jums sniedza atpūtu un spēku.',
        'Thank you so much for visiting SaimniekaPirts! We hope the sauna left you rested and renewed.',
        'Большое спасибо, что побывали у нас в SaimniekaPirts! Надеемся, баня подарила вам отдых и новые силы.'))
      : p(t('Paldies par dāvanu kartes pirkumu!', 'Thank you for buying a gift card!', 'Спасибо за покупку подарочной карты!')),
    p(t(`Pielikumā ir rēķins Nr. ${invoice.number} par ${eur(invoice.total)}. Tas ir apmaksāts – nekas vairs nav jādara.`,
      `Attached is invoice ${invoice.number} for ${eur(invoice.total, 'en')}. It has been paid – there is nothing more you need to do.`,
      `Во вложении счёт № ${invoice.number} на сумму ${eur(invoice.total, 'ru')}. Он оплачен – больше ничего делать не нужно.`)),
    visit ? reviewRequest(t) : '',
  ].join('');
  const title = visit ? t('Paldies par apmeklējumu!', 'Thank you for visiting!', 'Спасибо за визит!') : t('Jūsu rēķins', 'Your invoice', 'Ваш счёт');
  return { subject, html: guestLayout(title, body, locale, invoice.seller), filename };
}


// ---------------------------------------------------------------------------
// Advance invoice to the office: a copy, since the guest has been sent it.

export const manageLink = (invoice: { id: string; manage_token: string }) =>
  `${MANAGE_URL}?id=${invoice.id}&t=${invoice.manage_token}`;

// `cards`: how many gift card PDFs travel with it, to forward to the buyer.
export function invoiceEmail(invoice: InvoiceRow & { manage_token?: string }, cards = 0) {
  const subject =
    `Avansa rēķins ${invoice.number} · ${invoice.customer_name} · ${visitLv(invoice.details)} · ${eur(invoice.total)}` +
    (invoice.details?.payment === 'card' ? ' · apmaksāts ar karti' : '');
  const lines = invoice.items
    .map((item) => {
      const qty = item.quantity > 1 ? ` × ${item.quantity}` : '';
      return `<tr><td style="padding:4px 12px 4px 0">${escapeHtml(item.name.lv)}${qty}</td>` +
        `<td style="padding:4px 0;text-align:right;white-space:nowrap">${eur(item.amount)}</td></tr>`;
    })
    .join('');
  const phone = invoice.customer_phone ? `, tālr. ${escapeHtml(invoice.customer_phone)}` : '';
  const link = invoice.manage_token ? manageLink({ id: invoice.id, manage_token: invoice.manage_token }) : '';
  const card = invoice.details?.payment === 'card';
  const coveredByGiftCard = invoice.details?.payment === 'gift_card';
  const paidNote = card ? `Apmaksāts ar karti (Stripe) ${invoice.details?.paid_on ? formatDate(invoice.details.paid_on) : ''}.`.replace(' .', '.') : '';
  const next = invoice.source_type === 'reservation'
    ? `${paidNote ? `${paidNote} ` : ''}Gala rēķins klientam aizies automātiski nākamajā rītā pēc apmeklējuma un tiks saglabāts Google Drive.`
    : card
    ? `${paidNote} Klientam automātiski nosūtīts gala rēķins un dāvanu karte (PDF).`
    : 'Kad dāvanu karte ir apmaksāta, izraksti gala rēķinu ar saiti zemāk – klientam automātiski aizies rēķins un dāvanu karte (PDF), un rēķins tiks saglabāts Google Drive.';
  const headline = card && invoice.source_type === 'gift_card'
    ? 'Dāvanu karte apmaksāta ar karti; klientam nosūtīts rēķins un dāvanu karte uz'
    : card
    ? 'Apmaksāts ar karti. Rēķins nosūtīts klientam uz'
    : coveredByGiftCard
    ? 'Pilnībā apmaksāts ar dāvanu karti. Rēķins nosūtīts klientam uz'
    : 'Avansa rēķins nosūtīts klientam uz';

  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;font-size:14px;color:#1a1a1a;line-height:1.5">
<div style="background:#eef6ee;border:1px solid #9cc79c;border-radius:6px;padding:12px 14px;margin-bottom:18px">
${headline}
<a href="mailto:${escapeHtml(invoice.customer_email)}">${escapeHtml(invoice.customer_email)}</a>${phone}. Šī ir biroja kopija.
</div>
<p style="margin:0 0 4px"><strong>${escapeHtml(invoice.customer_name)}</strong></p>
<p style="margin:0 0 14px;color:#555">${escapeHtml(visitLv(invoice.details))} · avansa rēķins ${escapeHtml(invoice.number)} · ${card ? 'apmaksāts ar karti' : coveredByGiftCard ? 'apmaksāts ar dāvanu karti' : `apmaksāt līdz ${formatDate(invoice.due_on)}`}</p>
<table style="border-collapse:collapse;margin-bottom:6px">${lines}
<tr><td style="padding:8px 12px 4px 0;border-top:1px solid #ccc"><strong>Kopā</strong></td>
<td style="padding:8px 0 4px;border-top:1px solid #ccc;text-align:right"><strong>${eur(invoice.total)}</strong></td></tr></table>
<p style="margin:14px 0 0;color:#555">${next}</p>
${invoice.details?.replaces ? `<p style="margin:10px 0 0;color:#555">Aizstāj anulēto rēķinu ${escapeHtml(invoice.details.replaces)}.</p>` : ''}
${giftCardOfficeNote(invoice) ? `<p style="margin:10px 0 0;padding:10px 12px;background:${invoice.details?.gift_card_problem ? '#fdecea;border:1px solid #e0a39c' : '#eef6ee;border:1px solid #9cc79c'};border-radius:6px">${escapeHtml(giftCardOfficeNote(invoice))}</p>` : ''}
${cards ? `<p style="margin:10px 0 0;padding:10px 12px;background:#fff8e6;border:1px solid #e8c77a;border-radius:6px">Pielikumā arī dāvanu karte (${cards > 1 ? 'abi karšu varianti vienā PDF, un A4 atsevišķi' : 'abi varianti vienā PDF'}). Šo e-pastu var pārsūtīt klientam – rēķins un dāvanu karte nonāks pie viņa vienā vēstulē.</p>` : ''}
${link ? `<p style="margin:26px 0 0;padding-top:12px;border-top:1px solid #ddd;color:#555;font-size:13px">Pārvaldība (vajadzīgs PIN): <a href="${link}">anulēt avansa rēķinu vai izrakstīt gala rēķinu</a>. Ja rezervācija tiek atcelta, anulē avansa rēķinu – tad gala rēķins netiks izrakstīts.</p>` : ''}
</body></html>`;

  const text = [
    `${headline} ` +
      `${invoice.customer_email}${invoice.customer_phone ? `, tālr. ${invoice.customer_phone}` : ''}. Šī ir biroja kopija.`,
    '',
    invoice.customer_name,
    `${visitLv(invoice.details)} · avansa rēķins ${invoice.number} · ${card ? 'apmaksāts ar karti' : coveredByGiftCard ? 'apmaksāts ar dāvanu karti' : `apmaksāt līdz ${formatDate(invoice.due_on)}`}`,
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

// ---------------------------------------------------------------------------
// The notice, the morning after a visit paid by card or bank transfer, that
// its final invoice waits for the office: it goes to the guest only when the
// office issues it, from this link or the office's page.

export function finalPendingEmail(invoice: InvoiceRow, link: string, paidBy: string) {
  const d = invoice.details;
  const visit = d?.date ? [formatDate(d.date), d.time, d.sauna].filter(Boolean).join(', ') : '';
  const subject = `Gala rēķins gaida apstiprinājumu · ${invoice.customer_name} · ${visit}`;
  const rows: [string, string][] = [
    ['Klients', invoice.customer_name],
    ['E-pasts', invoice.customer_email],
    ['Apmeklējums', visit],
    ['Avansa rēķins', invoice.number],
    ['Summa', eur(invoice.total)],
    ['Apmaksa', paidBy],
  ];
  const table = rows
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:3px 14px 3px 0;color:#555">${escapeHtml(k)}</td><td style="padding:3px 0">${escapeHtml(v)}</td></tr>`)
    .join('');
  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;font-size:14px;color:#1a1a1a;line-height:1.5">
<p style="margin:0 0 14px">Apmeklējums ir noticis. <strong>Gala rēķins klientam vēl nav nosūtīts</strong> – tas aizies tikai pēc Jūsu apstiprinājuma.
Pārliecinieties, ka maksājums ir saņemts, un izrakstiet gala rēķinu (vajadzīgs biroja PIN). Klients to saņems kopā ar paldies un lūgumu atstāt atsauksmi.</p>
<table style="border-collapse:collapse;margin-bottom:18px">${table}</table>
<p><a href="${escapeHtml(link)}" style="display:inline-block;background:#3F9B38;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:bold">Izrakstīt gala rēķinu</a></p>
<p style="color:#555">Ja gala rēķins nav vajadzīgs, šo e-pastu var ignorēt. To pašu var izdarīt arī biroja lapā (saimniekapirts.lv/birojs).</p>
</body></html>`;
  const text = [
    'Apmeklējums ir noticis. Gala rēķins klientam vēl nav nosūtīts – tas aizies tikai pēc Jūsu apstiprinājuma.',
    '',
    ...rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`),
    '',
    `Izrakstīt gala rēķinu (vajadzīgs PIN): ${link}`,
  ].join('\n');
  return { subject, html, text };
}
