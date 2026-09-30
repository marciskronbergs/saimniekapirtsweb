// Draws the A4 ritual gift card: the owner's own two-page layout, refined.
// Page 1 says what the ritual is, what to know before it and what is
// included; page 2 lists the card's facts in tagged rows. It goes with a
// ritual gift card next to the 225 × 98 mm card, and the buyer gives
// whichever they like.
//
// Like the other cards it was designed as HTML (the design canvas) and
// measured from it: positions are in the design's CSS pixels, 794 × 1123 for
// the page, converted to PDF points here.

import {
  clip, closePath, endPath, lineTo, moveTo, PDFDocument, popGraphicsState, pushGraphicsState, rgb, setCharacterSpacing,
  LineCapStyle, type PDFFont, type PDFImage, type PDFPage, type RGB,
} from 'npm:pdf-lib@1.17.1';
import fontkit from 'npm:@pdf-lib/fontkit@1.1.1';
import type { GiftCardRitual } from './pricing.ts';
import { a4Steps, formatCardDate, giftCardA4Words, giftCardWords, ritualLine, ritualName } from './giftCardText.ts';
import { load } from './giftcard.ts';

export interface GiftCardA4Data {
  code: string;
  // Asked for with the number when the card is used to book online.
  pin: string;
  validUntil: string; // ISO date
  locale: 'lv' | 'en';
  ritual: GiftCardRitual;
}

// A4: 595.28 × 841.89 pt; 794 px wide in the design.
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const PX = PAGE_W / 794;
const H = PAGE_H / PX;

const hex = (h: string) => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
const INK = hex('#1D2A22');
const TEAL = hex('#46655F');
const TEAL_SOFT = hex('#6A807B');
const LABEL = hex('#5B726C');
const BODY = hex('#2F3A34');
const GREEN = hex('#3F9B38');
const STRIPE = hex('#4AA842');
const TAB = hex('#A9DA8E');
const BAND = hex('#6B6560');
const WHITE = rgb(1, 1, 1);

interface Text {
  font: PDFFont;
  size: number; // px
  color: RGB;
  spacing?: number; // letter-spacing, px
}

const width = (text: string, t: Text) =>
  t.font.widthOfTextAtSize(text, t.size) + (t.spacing ?? 0) * Math.max(0, [...text].length - 1);

// One line with its baseline at y (design px from the top).
function line(page: PDFPage, text: string, x: number, y: number, t: Text, align: 'left' | 'center' = 'left') {
  const w = width(text, t);
  const left = align === 'center' ? x - w / 2 : x;
  if (t.spacing) page.pushOperators(setCharacterSpacing(t.spacing * PX));
  page.drawText(text, { x: left * PX, y: (H - y) * PX, size: t.size * PX, font: t.font, color: t.color });
  if (t.spacing) page.pushOperators(setCharacterSpacing(0));
  return w;
}

const fitted = (text: string, t: Text, max: number, min: number): Text => {
  let size = t.size;
  while (size > min && width(text, { ...t, size }) > max) size -= 0.25;
  return { ...t, size };
};

// Breaks only at plain spaces; `first` is the room left on the first line.
function wrap(text: string, t: Text, max: number, first = max) {
  const lines: string[] = [];
  let current = '';
  for (const word of text.split(' ')) {
    const next = current ? `${current} ${word}` : word;
    if (current && width(next, t) > (lines.length ? max : first)) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function rect(page: PDFPage, x: number, y: number, w: number, h: number, color: RGB) {
  page.drawRectangle({ x: x * PX, y: (H - y - h) * PX, width: w * PX, height: h * PX, color });
}

// An SVG path in design px, its origin at (x, y).
function path(page: PDFPage, d: string, x: number, y: number, fill: RGB) {
  page.drawSvgPath(d, { x: x * PX, y: (H - y) * PX, scale: PX, color: fill, borderWidth: 0 });
}

// The page's green stripes (45°, 14 px each), as CSS draws
// repeating-linear-gradient(45deg, green 0 14px, stripe 14px 28px).
function stripes(page: PDFPage) {
  rect(page, 0, 0, 794, H, GREEN);
  const r2 = Math.SQRT2;
  let d = '';
  for (let c = 14; c < (794 + H) / r2 + 28; c += 28) {
    const y1 = H - c * r2;
    const y2 = H - (c + 14) * r2;
    d += `M0 ${y1} L794 ${y1 + 794} L794 ${y2 + 794} L0 ${y2} Z `;
  }
  path(page, d, 0, 0, STRIPE);
}

// A photo cut into a downward chevron, 232 × 206.
function chevron(page: PDFPage, img: PDFImage, x: number, y: number) {
  const w = 232;
  const h = 206;
  const pts: [number, number][] = [[0, 0], [w, 0], [w, h * 0.72], [w / 2, h], [0, h * 0.72]];
  const P = ([px, py]: [number, number]) => [(x + px) * PX, (H - y - py) * PX] as const;
  page.pushOperators(pushGraphicsState(), moveTo(...P(pts[0])));
  for (const p of pts.slice(1)) page.pushOperators(lineTo(...P(p)));
  page.pushOperators(closePath(), clip(), endPath());
  page.drawImage(img, { x: x * PX, y: (H - y - h) * PX, width: w * PX, height: h * PX });
  page.pushOperators(popGraphicsState());
}

// Lucide icons (24 × 24, drawn as strokes).
const ICONS = {
  pin: 'M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0 M9 10a3 3 0 1 0 6 0a3 3 0 1 0 -6 0',
  phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
  clock: 'M2 12a10 10 0 1 0 20 0a10 10 0 1 0 -20 0 M12 6v6l4 2',
  ticket: 'M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z M13 5v2 M13 17v2 M13 11v2',
  calendar: 'M8 2v4 M16 2v4 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M3 10h18 M9 16l2 2 4-4',
} as const;

function icon(page: PDFPage, name: keyof typeof ICONS, x: number, y: number, size: number) {
  page.drawSvgPath(ICONS[name], {
    x: x * PX, y: (H - y) * PX, scale: PX * size / 24,
    borderColor: INK, borderWidth: 1.8, borderLineCap: LineCapStyle.Round,
  });
}

interface Fonts {
  serifItalic: PDFFont;
  serifBold: PDFFont;
  sans: PDFFont;
  sansBold: PDFFont;
}

// The header both pages share: logo, title, three photos and the grey band.
function header(page: PDFPage, f: Fonts, logo: PDFImage, photos: PDFImage[], title: string, subtitle: string, band: string) {
  stripes(page);
  rect(page, 0, 0, 794, 300, WHITE);
  const logoH = 112;
  page.drawImage(logo, { x: 48 * PX, y: (H - 34 - logoH) * PX, width: logoH * logo.width / logo.height * PX, height: logoH * PX });
  line(page, title.toUpperCase(), 474, 83, fitted(title.toUpperCase(), { font: f.serifBold, size: 32, color: TEAL, spacing: 1.6 }, 568, 24), 'center');
  line(page, subtitle, 474, 123.59, fitted(subtitle, { font: f.serifItalic, size: 27, color: TEAL_SOFT }, 568, 20), 'center');
  photos.forEach((img, i) => chevron(page, img, [36, 281, 526][i], 170));
  rect(page, 0, 392, 794, 70, BAND);
  line(page, band.toUpperCase(), 397, 434.5, { font: f.sansBold, size: 21, color: WHITE, spacing: 6.72 }, 'center');
}

// Page 1: a white panel on the stripes, as tall as what it holds.
function infoPage(page: PDFPage, f: Fonts, card: GiftCardA4Data) {
  const w = giftCardA4Words[card.locale];
  const left = 92;
  const max = 610;
  const heading = { font: f.serifBold, size: 29, color: TEAL, spacing: 2.03 };
  const body = { font: f.sans, size: 13, color: BODY };
  const bold = { font: f.sansBold, size: 13, color: INK };
  const LH = 20.15;

  // Lay the panel out first, to know its height.
  const ops: ((page: PDFPage) => void)[] = [];
  let y = 462 + 30;
  const addHeading = (text: string) => {
    const base = y + 25;
    ops.push((p) => line(p, text.toUpperCase(), left, base, heading));
    y += 31.9;
  };
  const addPara = (text: string, top: number, lead?: string) => {
    y += top;
    const leadW = lead ? width(lead, bold) + width(' ', body) : 0;
    const lines = wrap(text, body, max, max - leadW);
    const first = y + 15;
    ops.push((p) => {
      if (lead) line(p, lead, left, first, bold);
      lines.forEach((l, i) => line(p, l, left + (i ? 0 : leadW), first + i * LH, body));
    });
    y += lines.length * LH;
  };
  const addDash = () => {
    y += 20;
    const top = y;
    ops.push((p) => {
      for (let x = left; x < left + max; x += 26) rect(p, x, top, Math.min(16, left + max - x), 4, BAND);
    });
    y += 4 + 16;
  };

  addHeading(w.more);
  addPara(w.beliefText, 12, w.belief);
  addPara(w.invite, 8);
  addDash();
  addHeading(w.important);
  addPara(w.water, 12);
  addPara(w.health, 8);
  addDash();
  addHeading(w.included);
  y += 12;
  a4Steps(card.ritual, card.locale).forEach(([title, text], i) => {
    const titleW = width(title, bold);
    const rest = `${String.fromCharCode(0xa0)}– ${text}`;
    const lines = wrap(rest, body, max - 22, max - 22 - titleW);
    const base = y + 14.91;
    ops.push((p) => {
      line(p, String(i + 1), left + 6, base, fitted(String(i + 1), { font: f.serifBold, size: 18, color: GREEN }, 20, 18), 'center');
      line(p, title, left + 22, base, bold);
      lines.forEach((l, n) => line(p, l, left + 22 + (n ? 0 : titleW), base + n * 19.5, body));
    });
    y += 20.5 + (lines.length - 1) * 19.5 + 6;
  });
  y -= 6;
  const bottom = Math.max(y + 32, 462 + 560);
  rect(page, 48, 462, 698, bottom - 462, WHITE);
  ops.forEach((op) => op(page));
}

// Page 2: the card's facts, one tagged row each.
function detailsPage(page: PDFPage, f: Fonts, card: GiftCardA4Data) {
  const w = giftCardA4Words[card.locale];
  const label = { font: f.sansBold, size: 10.5, color: LABEL, spacing: 2.31 };
  const small = { font: f.sans, size: 14, color: BODY };
  const big = { font: f.serifBold, size: 26, color: INK };
  const cx = 494;
  const room = 424;
  type Row = { icon: keyof typeof ICONS; label: string; big?: string; small: string[] };
  const rows: Row[] = [
    { icon: 'pin', label: w.place, small: [...w.placeLines] },
    { icon: 'phone', label: w.book, small: [...w.bookLines] },
    { icon: 'users', label: w.people, big: card.ritual.people[card.locale], small: [] },
    { icon: 'clock', label: w.duration, big: w.hours(card.ritual.hours), small: [] },
    { icon: 'ticket', label: w.cardNo, big: card.code, small: [w.codeLine(card.pin)] },
    { icon: 'calendar', label: w.valid, big: formatCardDate(card.validUntil), small: [] },
  ];
  rows.forEach((row, i) => {
    const top = 486 + i * 100;
    path(page, 'M18 0 H220 V84 H18 A18 18 0 0 1 0 66 V18 A18 18 0 0 1 18 0 Z', 60, top, TAB);
    path(page, 'M42 0 H486 A18 18 0 0 1 504 18 V66 A18 18 0 0 1 486 84 H42 A42 42 0 0 1 42 0 Z', 230, top, WHITE);
    icon(page, row.icon, 122, top + 23, 38);
    const fit = (text: string, t: Text, min: number) => fitted(text, t, room, min);
    if (!row.big) {
      line(page, row.label.toUpperCase(), cx, top + 23.61, fit(row.label.toUpperCase(), label, 8), 'center');
      row.small.forEach((s, n) => line(page, s, cx, top + 43.61 + n * 21.89, fit(s, small, 10), 'center'));
    } else if (!row.small.length) {
      line(page, row.label.toUpperCase(), cx, top + 29.7, fit(row.label.toUpperCase(), label, 8), 'center');
      line(page, row.big, cx, top + 57.7, fit(row.big, big, 18), 'center');
    } else {
      line(page, row.label.toUpperCase(), cx, top + 18.75, fit(row.label.toUpperCase(), label, 8), 'center');
      line(page, row.big, cx, top + 46.75, fit(row.big, big, 18), 'center');
      line(page, row.small[0], cx, top + 70.34, fit(row.small[0], small, 10), 'center');
    }
  });
}

export async function renderGiftCardA4Pdf(card: GiftCardA4Data): Promise<Uint8Array> {
  const w = giftCardA4Words[card.locale];
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(`${giftCardWords[card.locale].giftCard} ${card.code} · A4`);
  doc.setSubject(ritualName(card.ritual, card.locale));
  doc.setAuthor('SaimniekaPirts');
  doc.setLanguage(card.locale === 'lv' ? 'lv-LV' : 'en-GB');

  const [serifItalic, serifBold, sans, sansBold, logo, whisk, pond, rest] = await Promise.all([
    load('serifItalic'), load('serifBold'), load('sans'), load('sansBold'), load('logoOnLight'),
    load('a4Tub'), load('a4Whisk'), load('a4Scrub'),
  ]);
  const f: Fonts = {
    serifItalic: await doc.embedFont(serifItalic, { subset: true }),
    serifBold: await doc.embedFont(serifBold, { subset: true }),
    sans: await doc.embedFont(sans, { subset: true }),
    sansBold: await doc.embedFont(sansBold, { subset: true }),
  };
  const logoImage = await doc.embedPng(logo);
  const photos = [await doc.embedJpg(whisk), await doc.embedJpg(pond), await doc.embedJpg(rest)];
  const subtitle = ritualLine(card.ritual, card.locale);

  const info = doc.addPage([PAGE_W, PAGE_H]);
  header(info, f, logoImage, photos, w.title, subtitle, w.giftCard);
  infoPage(info, f, card);

  const details = doc.addPage([PAGE_W, PAGE_H]);
  header(details, f, logoImage, photos, w.title, subtitle, w.web);
  detailsPage(details, f, card);

  return await doc.save();
}
