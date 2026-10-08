// Draws an invoice as an A4 PDF.
//
// Everything is drawn from the stored invoice row, never from the booking, so
// sending the same invoice again always produces the same document.
//
// Two kinds: an advance invoice (avansa rēķins) when the guest books, and the
// invoice (rēķins) itself after the visit, marked paid. An annulled invoice is
// stamped so, for the archive.
//
// A Latvian guest gets a Latvian invoice. An English-speaking guest gets one
// with Latvian and English side by side: the company keeps its books in
// Latvian, and the guest can still read what they are paying for.

import { PDFDocument, rgb, degrees, type PDFFont, type PDFPage } from 'npm:pdf-lib@1.17.1';
import fontkit from 'npm:@pdf-lib/fontkit@1.1.1';
import { amountInWords } from './words.ts';
import type { PricedItem } from './pricing.ts';

export interface Seller {
  name: string;
  tradeName: string;
  regNumber: string;
  address: { lv: string; en: string };
  bank: string;
  swift: string;
  iban: string;
  email: string;
  phone: string;
  web: string;
}

export interface InvoiceDetails {
  kind: 'reservation' | 'gift_card';
  date?: string;
  time?: string;
  sauna?: string;
  // On a final invoice, the advance invoice it settles.
  advance_number?: string;
  // Paid by card through Stripe, on this day (both invoices say so), or
  // wholly by a gift card the guest gave when booking.
  payment?: 'card' | 'gift_card';
  paid_on?: string;
  // The gift card taken off the booking, or one the guest gave that did not hold.
  gift_card?: string;
  gift_card_problem?: { code: string; reason: string };
  // An advance invoice issued in place of an annulled one (a discount given later).
  replaces?: string;
  // The company the guest asked the invoice to be made out to. The customer
  // name, email and phone are then its contact person's.
  company?: InvoiceCompany;
}

export interface InvoiceCompany {
  name: string;
  regNumber: string;
  address: string;
  vatNumber?: string;
}

export interface InvoiceRow {
  id: string;
  kind: 'advance' | 'final';
  status?: 'issued' | 'annulled';
  paid?: boolean;
  number: string;
  issued_on: string;
  due_on: string;
  source_type: 'reservation' | 'gift_card';
  locale: 'lv' | 'en' | 'ru';
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  items: PricedItem[];
  total: number | string;
  seller: Seller;
  vat_note: string | null;
  details: InvoiceDetails | null;
}

// The fonts live on the website (public/fonts/invoice, with their licence),
// because the standard PDF fonts cannot draw Latvian letters and a guest's name
// may be in Cyrillic. They are fetched once per running instance. If the site
// cannot be reached the call fails, and the 15-minute retry sends the invoice.
const FONT_BASE = Deno.env.get('INVOICE_FONT_BASE') ?? 'https://saimniekapirts.lv/fonts/invoice';
let fonts: Promise<[ArrayBuffer, ArrayBuffer]> | null = null;

const fetchFont = async (file: string) => {
  const res = await fetch(`${FONT_BASE}/${file}`);
  if (!res.ok) throw new Error(`Font ${file}: HTTP ${res.status}`);
  return await res.arrayBuffer();
};

const loadFonts = () => {
  fonts ??= Promise.all([
    fetchFont('SaimniekaInvoiceSans-Regular.ttf'),
    fetchFont('SaimniekaInvoiceSans-Bold.ttf'),
  ]).catch((e) => {
    fonts = null;
    throw e;
  });
  return fonts;
};

// The logo the website header shows: white and green, made for a dark
// background, so the invoice opens with a dark band as the site does. If it
// cannot be fetched the invoice is still drawn, with the name in its place.
const LOGO_URL = Deno.env.get('INVOICE_LOGO_URL') ??
  'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/logo/logoTitle.png';
let logo: Promise<ArrayBuffer | null> | null = null;

const loadLogo = () => {
  logo ??= fetch(LOGO_URL)
    .then((res) => (res.ok ? res.arrayBuffer() : null))
    .catch(() => null)
    .then((bytes) => {
      if (!bytes) logo = null; // try again next time
      return bytes;
    });
  return logo;
};

export const formatDate = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}.${m}.${y}`;
};

export const formatMoney = (amount: number, locale: 'lv' | 'en' | 'ru') => {
  const fixed = Number(amount).toFixed(2);
  return locale === 'en' ? fixed : fixed.replace('.', ',');
};

const saunaNames: Record<string, { lv: string; en: string; ru: string }> = {
  'Baltā pirts': { lv: 'Baltā pirts', en: 'White sauna', ru: 'Белая баня' },
  'Pelēkā pirts': { lv: 'Pelēkā pirts', en: 'Grey sauna', ru: 'Серая баня' },
};

const unitNames = {
  pcs: { lv: 'gab.', en: 'pcs', ru: 'шт.' },
  person: { lv: 'pers.', en: 'person', ru: 'чел.' },
  service: { lv: 'pakalp.', en: 'service', ru: 'услуга' },
};

const ink = rgb(0.1, 0.1, 0.1);
const grey = rgb(0.42, 0.42, 0.42);
const rule = rgb(0.82, 0.82, 0.82);
const band = rgb(0.04, 0.04, 0.04);
const white = rgb(1, 1, 1);
const brandGreen = rgb(0.31, 0.79, 0.29);

export async function renderInvoicePdf(invoice: InvoiceRow): Promise<Uint8Array> {
  // A guest who booked in English or Russian gets that language beside the Latvian.
  const second = invoice.locale === 'lv' ? null : invoice.locale;
  const bilingual = second !== null;
  const final = invoice.kind === 'final';
  const annulled = invoice.status === 'annulled';
  const L = (lv: string, en: string, ru: string) => (second ? `${lv} / ${second === 'ru' ? ru : en}` : lv);
  const other = (en: string, ru: string) => (second === 'ru' ? ru : en);
  const money = (n: number) => formatMoney(n, invoice.locale);
  const total = Number(invoice.total);
  const seller = invoice.seller;

  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const [regularBytes, boldBytes] = await loadFonts();
  const regular = await doc.embedFont(regularBytes, { subset: true });
  const bold = await doc.embedFont(boldBytes, { subset: true });
  doc.setTitle(`${final ? L('Rēķins', 'Invoice', 'Счёт') : L('Avansa rēķins', 'Advance invoice', 'Счёт на предоплату')} ${invoice.number}`);
  doc.setAuthor(seller.name);
  doc.setCreator(seller.web);

  // Anything the font cannot draw (an emoji in a name, say) would otherwise be
  // an empty box or an error, so it is left out.
  const drawable = new Set(regular.getCharacterSet());
  const clean = (s: string) =>
    Array.from(s)
      .filter((ch) => drawable.has(ch.codePointAt(0)!) || /\s/.test(ch))
      .join('')
      .replace(/\s+/g, ' ')
      .trim();

  const pageSize: [number, number] = [595.28, 841.89];
  const left = 50;
  const right = pageSize[0] - 50;
  let page: PDFPage = doc.addPage(pageSize);
  let y = pageSize[1] - 56;

  const text = (
    s: string,
    x: number,
    opts: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb>; align?: 'left' | 'right' } = {}
  ) => {
    const font = opts.font ?? regular;
    const size = opts.size ?? 9.5;
    const str = clean(s);
    const width = font.widthOfTextAtSize(str, size);
    page.drawText(str, {
      x: opts.align === 'right' ? x - width : x,
      y,
      size,
      font,
      color: opts.color ?? ink,
    });
  };

  const wrap = (s: string, font: PDFFont, size: number, width: number): string[] => {
    const lines: string[] = [];
    let line = '';
    for (const word of clean(s).split(' ')) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) <= width || !line) line = next;
      else {
        lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
    return lines;
  };

  const hr = (color = rule, thickness = 0.8) =>
    page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness, color });

  const ensureRoom = (needed: number) => {
    if (y - needed > 70) return;
    page = doc.addPage(pageSize);
    y = pageSize[1] - 56;
  };

  // Heading: a dark band with the logo, and which invoice this is.
  const bandHeight = 84;
  const bandBottom = pageSize[1] - bandHeight;
  page.drawRectangle({ x: 0, y: bandBottom, width: pageSize[0], height: bandHeight, color: band });
  const logoBytes = await loadLogo();
  const logoImage = logoBytes ? await doc.embedPng(logoBytes).catch(() => null) : null;
  if (logoImage) {
    const scale = Math.min(44 / logoImage.height, 230 / logoImage.width);
    const w = logoImage.width * scale;
    const h = logoImage.height * scale;
    page.drawImage(logoImage, { x: left, y: bandBottom + (bandHeight - h) / 2, width: w, height: h });
  } else {
    y = bandBottom + 34;
    text('Saimnieka', left, { font: bold, size: 22, color: white });
    text('Pirts', left + bold.widthOfTextAtSize('Saimnieka', 22), { font: bold, size: 22, color: brandGreen });
  }
  y = bandBottom + 44;
  const title = final ? L('RĒĶINS', 'INVOICE', 'СЧЁТ') : L('AVANSA RĒĶINS', 'ADVANCE INVOICE', 'СЧЁТ НА ПРЕДОПЛАТУ');
  text(title, right, { font: bold, size: bilingual && !final ? (second === 'ru' ? 13 : 15) : 18, color: white, align: 'right' });
  y = bandBottom + 24;
  text(`Nr. ${invoice.number}`, right, { font: bold, size: 11, color: brandGreen, align: 'right' });

  y = bandBottom - 24;
  text(`${seller.web} · ${seller.email} · ${seller.phone}`, left, { size: 8.5, color: grey });
  text(`${L('Datums', 'Date', 'Дата')}: ${formatDate(invoice.issued_on)}`, right, { align: 'right' });
  y -= 14;
  if (final || invoice.details?.payment === 'card' || invoice.details?.payment === 'gift_card') {
    text(L('Apmaksāts', 'Paid', 'Оплачено'), right, { font: bold, color: brandGreen, align: 'right' });
  } else {
    text(`${L('Apmaksāt līdz', 'Due by', 'Оплатить до')}: ${formatDate(invoice.due_on)}`, right, { font: bold, align: 'right' });
  }
  y -= 30;

  // Seller and buyer side by side.
  const col2 = left + 270;
  const top = y;
  text(L('Pakalpojuma sniedzējs', 'Supplier', 'Исполнитель'), left, { font: bold, size: 8.5, color: grey });
  y -= 15;
  text(seller.name, left, { font: bold, size: 10.5 });
  const sellerLines = [
    `${L('Reģ. Nr.', 'Reg. No.', 'Рег. №')}: ${seller.regNumber}`,
    ...wrap(`${L('Adrese', 'Address', 'Адрес')}: ${seller.address.lv}`, regular, 9, 250),
    `${L('Banka', 'Bank', 'Банк')}: ${seller.bank}, SWIFT ${seller.swift}`,
    `${L('Konts', 'Account', 'Счёт')}: ${seller.iban}`,
    invoice.vat_note === 'Nav PVN maksātājs'
      ? L('Nav PVN maksātājs', 'Not a VAT payer', 'Не является плательщиком НДС')
      : invoice.vat_note ?? '',
  ].filter(Boolean);
  for (const line of sellerLines) {
    y -= 13;
    text(line, left, { size: 9 });
  }
  const sellerBottom = y;

  y = top;
  text(L('Saņēmējs', 'Customer', 'Получатель'), col2, { font: bold, size: 8.5, color: grey });
  y -= 15;
  // A company first, with its registration number and address; the guest is
  // then its contact person.
  const company = invoice.details?.company;
  const recipient = company?.name ?? invoice.customer_name;
  for (const [i, line] of wrap(recipient, bold, 10.5, right - col2).entries()) {
    if (i) y -= 13;
    text(line, col2, { font: bold, size: 10.5 });
  }
  const contact = [invoice.customer_email, invoice.customer_phone ?? ''].filter(Boolean);
  const recipientLines = company
    ? [
        `${L('Reģ. Nr.', 'Reg. No.', 'Рег. №')}: ${company.regNumber}`,
        ...(company.vatNumber ? [`${L('PVN Nr.', 'VAT No.', 'НДС №')}: ${company.vatNumber}`] : []),
        `${L('Adrese', 'Address', 'Адрес')}: ${company.address}`,
        ...(invoice.customer_name.trim() && invoice.customer_name.trim() !== company.name
          ? [`${L('Kontaktpersona', 'Contact', 'Контактное лицо')}: ${invoice.customer_name.trim()}`]
          : []),
        ...contact,
      ]
    : contact;
  for (const line of recipientLines.flatMap((l) => wrap(l, regular, 9, right - col2))) {
    y -= 13;
    text(line, col2, { size: 9 });
  }

  y = Math.min(y, sellerBottom) - 26;

  // What the invoice is for.
  const d = invoice.details;
  if (d?.kind === 'reservation' && d.date) {
    const sauna = d.sauna ? saunaNames[d.sauna] ?? { lv: d.sauna, en: d.sauna, ru: d.sauna } : null;
    const when = [formatDate(d.date), d.time, sauna ? L(sauna.lv, sauna.en, sauna.ru) : ''].filter(Boolean).join(', ');
    text(`${L('Apmeklējuma laiks', 'Visit', 'Визит')}: ${when}`, left, { size: 9.5 });
    y -= 18;
  }
  if (final && d?.advance_number) {
    text(`${L('Avansa rēķins', 'Advance invoice', 'Счёт на предоплату')}: ${d.advance_number}`, left, { size: 9.5 });
    y -= 18;
  }

  // The lines.
  const cols = { nr: left, name: left + 22, qty: left + 300, unit: left + 310, price: left + 420, amount: right };
  const nameWidth = cols.qty - cols.name - 36;
  // In the two-language version each heading gets its English under it, as the
  // lines do, rather than running into its neighbour.
  const headerHeight = bilingual ? 30 : 20;
  page.drawRectangle({ x: left, y: y - headerHeight + 14, width: right - left, height: headerHeight, color: rgb(0.94, 0.96, 0.94) });
  const heading = (lv: string, en: string, x: number, align: 'left' | 'right' = 'left') => {
    text(lv, x, { font: bold, size: 8.5, align });
    if (!bilingual) return;
    y -= 10;
    text(en, x, { size: 7.5, color: grey, align });
    y += 10;
  };
  heading('Nr.', other('No.', '№'), cols.nr + 3);
  heading('Nosaukums', other('Description', 'Наименование'), cols.name);
  heading('Daudz.', other('Qty', 'Кол-во'), cols.qty, 'right');
  heading('Mērv.', other('Unit', 'Ед.'), cols.unit);
  heading('Cena, EUR', other('Price, EUR', 'Цена, EUR'), cols.price, 'right');
  heading('Summa, EUR', other('Amount, EUR', 'Сумма, EUR'), cols.amount, 'right');
  y -= headerHeight + 4;

  invoice.items.forEach((item, index) => {
    const nameLines = wrap(item.name.lv, regular, 9.5, nameWidth);
    // Lines priced before Russian came in have no Russian name: English then.
    const otherName = second === 'ru' ? (item.name as { ru?: string }).ru ?? item.name.en : item.name.en;
    const enLines = bilingual ? wrap(otherName, regular, 8.5, nameWidth) : [];
    ensureRoom(14 * (nameLines.length + enLines.length) + 8);
    const unit = unitNames[item.unit] ?? unitNames.pcs;
    text(`${index + 1}.`, cols.nr + 3);
    text(String(item.quantity), cols.qty, { align: 'right' });
    text(unit.lv, cols.unit, { size: 8.5 });
    text(money(item.unitPrice), cols.price, { align: 'right' });
    text(money(item.amount), cols.amount, { align: 'right' });
    nameLines.forEach((line, i) => {
      if (i) y -= 12;
      text(line, cols.name);
    });
    enLines.forEach((line, i) => {
      y -= 11;
      text(line, cols.name, { size: 8.5, color: grey });
      if (i === 0) text(other(unit.en, unit.ru), cols.unit, { size: 7.5, color: grey });
    });
    y -= 10;
    hr();
    y -= 14;
  });

  // Totals.
  ensureRoom(90);
  y -= 4;
  const labelX = left + 250;
  text(L('PVN', 'VAT', 'НДС'), labelX);
  text(L('nav piemērojams', 'not applicable', 'не применяется'), cols.amount, { align: 'right', color: grey });
  y -= 18;
  text(final ? L('Kopā', 'Total', 'Итого') : L('Kopā apmaksai', 'Total due', 'Итого к оплате'), labelX, { font: bold, size: 11 });
  text(`${money(total)} EUR`, cols.amount, { font: bold, size: 11, align: 'right' });
  y -= 26;

  text(`${L('Summa vārdiem', 'Amount in words', 'Сумма прописью')}: ${amountInWords(total, 'lv')}`, left, { size: 9 });
  if (bilingual) {
    y -= 12;
    text(amountInWords(total, second === 'ru' ? 'ru' : 'en'), left, { size: 9, color: grey });
  }
  y -= 26;

  // How to pay, or that it has been paid.
  ensureRoom(80);
  text(L('Apmaksa', 'Payment', 'Оплата'), left, { font: bold, size: 10 });
  y -= 15;
  const card = invoice.details?.payment === 'card';
  const paidOn = invoice.details?.paid_on ? formatDate(invoice.details.paid_on) : '';
  const byGiftCard = invoice.details?.payment === 'gift_card';
  const payment = card ? [
    L(`Apmaksāts ar maksājumu karti ${paidOn}. Paldies!`, `Paid by card on ${paidOn}. Thank you!`, `Оплачено картой ${paidOn}. Спасибо!`),
  ] : byGiftCard ? [
    L(`Apmaksāts ar dāvanu karti Nr. ${invoice.details?.gift_card ?? ''}. Paldies!`,
      `Paid with gift card no. ${invoice.details?.gift_card ?? ''}. Thank you!`,
      `Оплачено подарочной картой № ${invoice.details?.gift_card ?? ''}. Спасибо!`),
  ] : final ? [
    L('Rēķins ir apmaksāts. Paldies!', 'This invoice has been paid in full. Thank you!', 'Счёт оплачен полностью. Спасибо!'),
  ] : [
    L(`Ar pārskaitījumu līdz ${formatDate(invoice.due_on)}`, `By bank transfer by ${formatDate(invoice.due_on)}`, `Банковским переводом до ${formatDate(invoice.due_on)}`) +
      ` – ${seller.name}, ${seller.iban}, ${seller.bank}.`,
    L(`Maksājuma mērķī norādiet rēķina numuru ${invoice.number}.`, `Please quote invoice number ${invoice.number} as the payment reference.`, `В назначении платежа укажите номер счёта ${invoice.number}.`),
  ];
  for (const para of payment) {
    for (const line of wrap(para, regular, 9, right - left)) {
      text(line, left, { size: 9 });
      y -= 12;
    }
  }

  // An annulled invoice keeps its number and is stamped, never deleted.
  if (annulled) {
    const stamp = L('ANULĒTS', 'ANNULLED', 'АННУЛИРОВАН');
    const size = 54;
    const red = rgb(0.8, 0.1, 0.1);
    for (const p of doc.getPages()) {
      const w = bold.widthOfTextAtSize(stamp, size);
      p.drawText(stamp, {
        x: (pageSize[0] - w * Math.cos(Math.PI / 7)) / 2,
        y: pageSize[1] / 2 - 60,
        size,
        font: bold,
        color: red,
        opacity: 0.35,
        rotate: degrees(25),
      });
    }
  }

  // Footer on every page.
  for (const p of doc.getPages()) {
    page = p;
    page.drawLine({ start: { x: left, y: 58 }, end: { x: right, y: 58 }, thickness: 0.6, color: rule });
    y = 46;
    text('Rēķins sagatavots elektroniski un ir derīgs bez paraksta.', left, { size: 7.5, color: grey });
    text(`${seller.name} · ${L('Reģ. Nr.', 'Reg. No.', 'Рег. №')} ${seller.regNumber}`, right, { size: 7.5, color: grey, align: 'right' });
    if (bilingual) {
      y = 36;
      text(other('This invoice was prepared electronically and is valid without a signature.',
        'Счёт составлен в электронном виде и действителен без подписи.'), left, { size: 7.5, color: grey });
    }
  }

  return await doc.save();
}
