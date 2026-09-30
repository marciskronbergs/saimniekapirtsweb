// Draws a gift card as a two-page PDF, 225 × 98 mm: a front and a back, in
// the language the order was placed in, with the owner's own photos. The
// herbal hot tub on the left and a linen panel on the right; on the back, how
// to use the card beside the pond. A value card shows its amount ("pirts
// priekiem"); a ritual card names the ritual in its place, and comes with an
// A4 version as well (giftcardA4.ts).
//
// The layout was designed as HTML (the "SaimniekaPirts dāvanu kartes" design
// canvas) and measured from it: every position below is in the design's CSS
// pixels, 850 × 370 for the whole card, and converted to PDF points here. The
// words are shared with the preview on the gift card page (giftCardText.ts).

import { PDFDocument, rgb, setCharacterSpacing, type PDFFont, type PDFImage, type PDFPage, type RGB } from 'npm:pdf-lib@1.17.1';
import fontkit from 'npm:@pdf-lib/fontkit@1.1.1';
import type { GiftCardRitual } from './pricing.ts';
import { formatCardDate, giftCardWords, ritualLine, ritualName, type GiftCardWords } from './giftCardText.ts';

export interface GiftCardData {
  code: string;
  // Asked for with the number when the card is used to book online.
  pin: string;
  validUntil: string; // ISO date
  locale: 'lv' | 'en';
  // A ritual card names the ritual and shows no price; a value card shows its value.
  ritual: GiftCardRitual | null;
  value: number;
}

// The fonts (public/fonts/giftcard, with their licence) and pictures
// (public/giftcard) live on the website, like the invoice font, and are
// fetched once per running instance.
const ASSET_BASE = Deno.env.get('GIFT_CARD_ASSET_BASE') ?? 'https://saimniekapirts.lv';
const FILES = {
  serifItalic: 'fonts/giftcard/CormorantGaramond_500Medium_Italic.ttf',
  serifBold: 'fonts/giftcard/CormorantGaramond_600SemiBold.ttf',
  sans: 'fonts/giftcard/Montserrat_400Regular.ttf',
  sansBold: 'fonts/giftcard/Montserrat_600SemiBold.ttf',
  valueFront: 'giftcard/value_front.jpg',
  valueBack: 'giftcard/value_back.jpg',
  logoOnLight: 'giftcard/logo_on_light.png',
  a4Whisk: 'giftcard/a4_whisk.jpg',
  a4Pond: 'giftcard/a4_pond.jpg',
  a4Rest: 'giftcard/a4_rest.jpg',
} as const;
export type GiftCardAsset = keyof typeof FILES;
type Asset = GiftCardAsset;
const cache = new Map<Asset, Promise<ArrayBuffer>>();

export const load = (key: Asset) => {
  let p = cache.get(key);
  if (!p) {
    p = fetch(`${ASSET_BASE}/${FILES[key]}`).then(async (res) => {
      if (!res.ok) throw new Error(`Gift card ${FILES[key]}: HTTP ${res.status}`);
      return await res.arrayBuffer();
    });
    p.catch(() => cache.delete(key));
    cache.set(key, p);
  }
  return p;
};

// Design pixels to PDF points: the card is 225 mm wide, 850 px in the design,
// and 98 mm tall, a hair over the design's 370 px (photos fill the full height).
const PX = (225 / 25.4 * 72) / 850;
const W = 850;
const H = (98 / 25.4 * 72) / PX;

const hex = (h: string) => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
const INK = hex('#1D2A22');
const SOFT = hex('#55615A');
const LABEL = hex('#5E665F');
const HONEY = hex('#8A5A22');
const RULE = hex('#C9BDA5');
const LINEN = hex('#F4EFE6');
const PAPER = hex('#F7F3EC');
const TAGLINE = hex('#3B5443');

interface Fonts {
  serifItalic: PDFFont;
  serifBold: PDFFont;
  sans: PDFFont;
  sansBold: PDFFont;
}

interface Text {
  font: PDFFont;
  size: number; // px
  color: RGB;
  spacing?: number; // letter-spacing, px
}

const width = (text: string, t: Text) =>
  t.font.widthOfTextAtSize(text, t.size) + (t.spacing ?? 0) * Math.max(0, [...text].length - 1);

// Draws one line with its baseline at y (design px from the top), starting
// at x, centred on x or ending at x.
function line(page: PDFPage, text: string, x: number, y: number, t: Text, align: 'left' | 'center' | 'right' = 'left') {
  const w = width(text, t);
  const left = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  if (t.spacing) page.pushOperators(setCharacterSpacing(t.spacing * PX));
  page.drawText(text, { x: left * PX, y: (H - y) * PX, size: t.size * PX, font: t.font, color: t.color });
  if (t.spacing) page.pushOperators(setCharacterSpacing(0));
  return w;
}

// The largest size, from `t.size` down to `min`, at which the text fits.
const fitted = (text: string, t: Text, max: number, min: number): Text => {
  let size = t.size;
  while (size > min && width(text, { ...t, size }) > max) size -= 0.25;
  return { ...t, size };
};

// Breaks only at plain spaces: the words keep their no-break spaces.
function wrap(text: string, t: Text, max: number) {
  const lines: string[] = [];
  let current = '';
  for (const word of text.split(' ')) {
    const next = current ? `${current} ${word}` : word;
    if (current && width(next, t) > max) {
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

function image(page: PDFPage, img: PDFImage, x: number, y: number, w: number, h: number) {
  page.drawImage(img, { x: x * PX, y: (H - y - h) * PX, width: w * PX, height: h * PX });
}

// ---------------------------------------------------------------------------
// The pieces the fronts share: the logo, the "gift card" line, and the
// number, date and contact line anchored to the bottom of the panel.

function frontCommon(page: PDFPage, f: Fonts, w: GiftCardWords, card: GiftCardData, logo: PDFImage, axis: number, panel: [number, number],
  colors: { eyebrow: RGB; rule: RGB; label: RGB; value: RGB; footer: RGB }) {
  image(page, logo, axis - 29.74, 30, 59.48, 64);
  line(page, w.giftCard.toUpperCase(), axis, 121, { font: f.sansBold, size: 11, color: colors.eyebrow, spacing: 3.52 }, 'center');

  const [left, right] = panel;
  rect(page, left, 255.81, right - left, 1, colors.rule);
  rect(page, axis - 0.5, 268.81, 1, 33.39, colors.rule);
  const label = { font: f.sansBold, size: 10.5, color: colors.label, spacing: 2.52 };
  const value = { font: f.sansBold, size: 14, color: colors.value, spacing: 0.56 };
  const col1 = (left + axis) / 2;
  const col2 = (axis + right) / 2 + 0.5;
  line(page, w.no.toUpperCase(), col1, 277.81, label, 'center');
  line(page, card.code, col1, 298.41, value, 'center');
  line(page, w.validUntil.toUpperCase(), col2, 277.81, label, 'center');
  line(page, formatCardDate(card.validUntil), col2, 298.41, value, 'center');
  line(page, w.contact, axis, 342.2, { font: f.sans, size: 11.5, color: colors.footer, spacing: 0.69 }, 'center');
}

// A title, a line in italics and a line of facts, as on the ritual card.
// They shrink to fit the panel rather than wrap.
function titleBlock(page: PDFPage, f: Fonts, axis: number, max: number, lines: [string, string, string],
  colors: { title: RGB; line: RGB; facts: RGB }) {
  const [title, second, facts] = lines;
  line(page, title, axis, 170.19, fitted(title, { font: f.serifBold, size: 46, color: colors.title }, max, 36), 'center');
  line(page, second, axis, 204.19, fitted(second, { font: f.serifItalic, size: 24, color: colors.line }, max, 19), 'center');
  line(page, facts, axis, 232.78, fitted(facts, { font: f.sans, size: 12, color: colors.facts, spacing: 0.6 }, max, 10), 'center');
}

// The backs' header row, and their footer anchored to the bottom.
function backCommon(page: PDFPage, f: Fonts, w: GiftCardWords, card: GiftCardData, left: number, right: number, header: string) {
  line(page, w.giftCard.toUpperCase(), left, 45, { font: f.sansBold, size: 11, color: HONEY, spacing: 3.52 });
  line(page, header, right, 45, { font: f.sansBold, size: 12, color: INK, spacing: 0.48 }, 'right');
  rect(page, left, 300.31, right - left, 1, RULE);
  const small = { font: f.sans, size: 11, color: LABEL };
  line(page, w.validity(formatCardDate(card.validUntil)), left, 322.31, small);
  line(page, 'saimniekapirts.lv', right, 322.31, { font: f.sansBold, size: 11, color: INK }, 'right');
  line(page, w.address, left, 340.16, small);
}

// ---------------------------------------------------------------------------

export async function renderGiftCardPdf(card: GiftCardData): Promise<Uint8Array> {
  const ritual = card.ritual;
  const w = giftCardWords[card.locale];
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(`${w.giftCard} ${card.code}`);
  doc.setSubject(ritual ? ritualName(ritual, card.locale) : `${card.value} EUR · ${w.tagline}`);
  doc.setAuthor('SaimniekaPirts');
  doc.setLanguage(card.locale === 'lv' ? 'lv-LV' : 'en-GB');

  const [serifItalic, serifBold, sans, sansBold, front, back, logo] = await Promise.all([
    load('serifItalic'), load('serifBold'), load('sans'), load('sansBold'),
    load('valueFront'), load('valueBack'), load('logoOnLight'),
  ]);
  const f: Fonts = {
    serifItalic: await doc.embedFont(serifItalic, { subset: true }),
    serifBold: await doc.embedFont(serifBold, { subset: true }),
    sans: await doc.embedFont(sans, { subset: true }),
    sansBold: await doc.embedFont(sansBold, { subset: true }),
  };
  const frontImage = await doc.embedJpg(front);
  const backImage = await doc.embedJpg(back);
  const logoImage = await doc.embedPng(logo);

  const pageFront = doc.addPage([W * PX, H * PX]);
  const pageBack = doc.addPage([W * PX, H * PX]);

  // ---- Front: photo left, linen panel right.
  rect(pageFront, 0, 0, W, H, LINEN);
  image(pageFront, frontImage, 0, 0, 490, H);
  const axis = 670;
  frontCommon(pageFront, f, w, card, logoImage, axis, [524, 816],
    { eyebrow: HONEY, rule: RULE, label: LABEL, value: INK, footer: LABEL });
  if (ritual) {
    titleBlock(pageFront, f, axis, 292, [w.ritual, ritualLine(ritual, card.locale), w.facts(ritual)],
      { title: INK, line: TAGLINE, facts: LABEL });
  } else {
    // The numeral sits on the panel's axis (nudged 4 px left for the eye),
    // "EUR" beside it on the same baseline.
    const amount = String(card.value);
    const numeral = { font: f.serifBold, size: 86, color: INK };
    const nw = width(amount, numeral);
    const nx = axis - 4 - nw / 2;
    line(pageFront, amount, nx, 195.19, numeral);
    line(pageFront, 'EUR', nx + nw + 9, 195.19, { font: f.sansBold, size: 15, color: HONEY, spacing: 2.4 });
    line(pageFront, w.tagline, axis, 230.88, { font: f.serifItalic, size: 25, color: TAGLINE }, 'center');
  }

  // ---- Back: how to use it, photo right. The header carries the code the
  // card is booked online with.
  rect(pageBack, 0, 0, W, H, PAPER);
  image(pageBack, backImage, 594, 0, 256, H);
  const left = 44;
  const right = 554;
  const header = `${w.no} ${card.code} · ${w.code} ${card.pin}${ritual ? '' : ` · ${card.value} EUR`}`;
  backCommon(pageBack, f, w, card, left, right, header);
  line(pageBack, w.howTo, left, 85.39, { font: f.serifItalic, size: 32, color: INK });
  const stepText = { font: f.sans, size: 13, color: INK };
  let y = 126.98;
  w.steps.forEach((step, i) => {
    line(pageBack, String(i + 1), left + 6, y, { font: f.serifBold, size: 21, color: HONEY }, 'center');
    const lines = wrap(step, stepText, 486);
    lines.forEach((l, n) => line(pageBack, l, left + 24, y + n * 18.85, stepText));
    y += (i < w.steps.length - 1) ? 3 + lines.length * 18.85 + 11 : (lines.length - 1) * 18.85;
  });
  const note = { font: f.sans, size: 12.5, color: SOFT };
  wrap(ritual ? w.ritualService(ritual) : w.anyService, note, 510)
    .forEach((l, n) => line(pageBack, l, left, y + 35.84 + n * 18.125, note));

  return await doc.save();
}
