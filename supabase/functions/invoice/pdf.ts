// Draws an invoice as an A4 PDF.
//
// Everything is drawn from the stored invoice row, never from the booking, so
// sending the same invoice again always produces the same document.
//
// A Latvian guest gets a Latvian invoice. An English-speaking guest gets one
// with Latvian and English side by side: the company keeps its books in
// Latvian, and the guest can still read what they are paying for.

import { PDFDocument, rgb, type PDFFont, type PDFPage } from 'npm:pdf-lib@1.17.1';
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
}

export interface InvoiceRow {
  id: string;
  number: string;
  issued_on: string;
  due_on: string;
  source_type: 'reservation' | 'gift_card';
  locale: 'lv' | 'en';
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

export const formatDate = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}.${m}.${y}`;
};

export const formatMoney = (amount: number, locale: 'lv' | 'en') => {
  const fixed = Number(amount).toFixed(2);
  return locale === 'lv' ? fixed.replace('.', ',') : fixed;
};

const saunaNames: Record<string, { lv: string; en: string }> = {
  'Baltā pirts': { lv: 'Baltā pirts', en: 'White sauna' },
  'Pelēkā pirts': { lv: 'Pelēkā pirts', en: 'Grey sauna' },
};

const unitNames = {
  pcs: { lv: 'gab.', en: 'pcs' },
  person: { lv: 'pers.', en: 'person' },
  service: { lv: 'pakalp.', en: 'service' },
};

const ink = rgb(0.1, 0.1, 0.1);
const grey = rgb(0.42, 0.42, 0.42);
const green = rgb(0.13, 0.5, 0.25);
const rule = rgb(0.82, 0.82, 0.82);

export async function renderInvoicePdf(invoice: InvoiceRow): Promise<Uint8Array> {
  const bilingual = invoice.locale === 'en';
  const L = (lv: string, en: string) => (bilingual ? `${lv} / ${en}` : lv);
  const money = (n: number) => formatMoney(n, invoice.locale);
  const total = Number(invoice.total);
  const seller = invoice.seller;

  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const [regularBytes, boldBytes] = await loadFonts();
  const regular = await doc.embedFont(regularBytes, { subset: true });
  const bold = await doc.embedFont(boldBytes, { subset: true });
  doc.setTitle(`${L('Rēķins', 'Invoice')} ${invoice.number}`);
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

  // Heading: who is issuing, and which invoice this is.
  text(seller.tradeName, left, { font: bold, size: 18, color: green });
  text(L('RĒĶINS', 'INVOICE'), right, { font: bold, size: 18, align: 'right' });
  y -= 16;
  text(`${seller.web} · ${seller.email} · ${seller.phone}`, left, { size: 8.5, color: grey });
  text(`Nr. ${invoice.number}`, right, { font: bold, size: 11, align: 'right' });
  y -= 14;
  text(`${L('Datums', 'Date')}: ${formatDate(invoice.issued_on)}`, right, { align: 'right' });
  y -= 13;
  text(`${L('Apmaksāt līdz', 'Due by')}: ${formatDate(invoice.due_on)}`, right, { font: bold, align: 'right' });
  y -= 22;
  hr(green, 1.2);
  y -= 22;

  // Seller and buyer side by side.
  const col2 = left + 270;
  const top = y;
  text(L('Pakalpojuma sniedzējs', 'Supplier'), left, { font: bold, size: 8.5, color: grey });
  y -= 15;
  text(seller.name, left, { font: bold, size: 10.5 });
  const sellerLines = [
    `${L('Reģ. Nr.', 'Reg. No.')}: ${seller.regNumber}`,
    ...wrap(`${L('Adrese', 'Address')}: ${seller.address.lv}`, regular, 9, 250),
    `${L('Banka', 'Bank')}: ${seller.bank}, SWIFT ${seller.swift}`,
    `${L('Konts', 'Account')}: ${seller.iban}`,
    invoice.vat_note ?? '',
  ].filter(Boolean);
  for (const line of sellerLines) {
    y -= 13;
    text(line, left, { size: 9 });
  }
  const sellerBottom = y;

  y = top;
  text(L('Saņēmējs', 'Customer'), col2, { font: bold, size: 8.5, color: grey });
  y -= 15;
  for (const [i, line] of wrap(invoice.customer_name, bold, 10.5, right - col2).entries()) {
    if (i) y -= 13;
    text(line, col2, { font: bold, size: 10.5 });
  }
  for (const line of [invoice.customer_email, invoice.customer_phone ?? ''].filter(Boolean)) {
    y -= 13;
    text(line, col2, { size: 9 });
  }

  y = Math.min(y, sellerBottom) - 26;

  // What the invoice is for.
  const d = invoice.details;
  if (d?.kind === 'reservation' && d.date) {
    const sauna = d.sauna ? saunaNames[d.sauna] ?? { lv: d.sauna, en: d.sauna } : null;
    const when = [formatDate(d.date), d.time, sauna ? L(sauna.lv, sauna.en) : ''].filter(Boolean).join(', ');
    text(`${L('Apmeklējuma laiks', 'Visit')}: ${when}`, left, { size: 9.5 });
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
  heading('Nr.', 'No.', cols.nr + 3);
  heading('Nosaukums', 'Description', cols.name);
  heading('Daudz.', 'Qty', cols.qty, 'right');
  heading('Mērv.', 'Unit', cols.unit);
  heading('Cena, EUR', 'Price, EUR', cols.price, 'right');
  heading('Summa, EUR', 'Amount, EUR', cols.amount, 'right');
  y -= headerHeight + 4;

  invoice.items.forEach((item, index) => {
    const nameLines = wrap(item.name.lv, regular, 9.5, nameWidth);
    const enLines = bilingual ? wrap(item.name.en, regular, 8.5, nameWidth) : [];
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
      if (i === 0) text(unit.en, cols.unit, { size: 7.5, color: grey });
    });
    y -= 10;
    hr();
    y -= 14;
  });

  // Totals.
  ensureRoom(90);
  y -= 4;
  const labelX = left + 250;
  text(L('PVN', 'VAT'), labelX);
  text(L('nav piemērojams', 'not applicable'), cols.amount, { align: 'right', color: grey });
  y -= 18;
  text(L('Kopā apmaksai', 'Total due'), labelX, { font: bold, size: 11 });
  text(`${money(total)} EUR`, cols.amount, { font: bold, size: 11, align: 'right' });
  y -= 26;

  text(`${L('Summa vārdiem', 'Amount in words')}: ${amountInWords(total, 'lv')}`, left, { size: 9 });
  if (bilingual) {
    y -= 12;
    text(amountInWords(total, 'en'), left, { size: 9, color: grey });
  }
  y -= 26;

  // How to pay.
  ensureRoom(80);
  text(L('Apmaksa', 'Payment'), left, { font: bold, size: 10 });
  y -= 15;
  const payment = [
    L(`Ar pārskaitījumu līdz ${formatDate(invoice.due_on)}`, `By bank transfer by ${formatDate(invoice.due_on)}`) +
      ` – ${seller.name}, ${seller.iban}, ${seller.bank}.`,
    L(`Maksājuma mērķī norādiet rēķina numuru ${invoice.number}.`, `Please quote invoice number ${invoice.number} as the payment reference.`),
  ];
  if (invoice.source_type === 'reservation') {
    payment.push(L('Var norēķināties arī skaidrā naudā uz vietas.', 'You can also pay in cash on site.'));
  }
  for (const para of payment) {
    for (const line of wrap(para, regular, 9, right - left)) {
      text(line, left, { size: 9 });
      y -= 12;
    }
  }

  // Footer on every page.
  for (const p of doc.getPages()) {
    page = p;
    page.drawLine({ start: { x: left, y: 58 }, end: { x: right, y: 58 }, thickness: 0.6, color: rule });
    y = 46;
    text('Rēķins sagatavots elektroniski un ir derīgs bez paraksta.', left, { size: 7.5, color: grey });
    text(`${seller.name} · ${L('Reģ. Nr.', 'Reg. No.')} ${seller.regNumber}`, right, { size: 7.5, color: grey, align: 'right' });
    if (bilingual) {
      y = 36;
      text('This invoice was prepared electronically and is valid without a signature.', left, { size: 7.5, color: grey });
    }
  }

  return await doc.save();
}
