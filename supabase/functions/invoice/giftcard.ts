// Draws a gift card as a two-page PDF, 225 × 98 mm, in the language the order
// was placed in: the owner's own "Dāvanu karte – PIRTS PRIEKIEM", a gold
// ribbon on navy, with a collage of the sauna on the back. The pictures
// (public/giftcard/card_front.jpg, card_back.jpg) carry the design and its
// title; the parts that change are drawn here: the number and its code for
// booking online, the amount (a ritual card: the ritual's price), the date,
// what the card is for (a ritual card names the ritual), and the footer.
// Every order also gets the light card (giftcardLight.ts), and a ritual the
// A4 card (giftcardA4.ts).
//
// Positions are in the pictures' own pixels, 2000 × 873 for the whole card.

import { PDFDocument, rgb, setCharacterSpacing, type PDFFont, type PDFPage, type RGB } from 'npm:pdf-lib@1.17.1';
import fontkit from 'npm:@pdf-lib/fontkit@1.1.1';
import type { GiftCardRitual } from './pricing.ts';
import { formatCardDate, giftCardWords, ritualName } from './giftCardText.ts';

export interface GiftCardData {
  code: string;
  // Asked for with the number when the card is used to book online.
  pin: string;
  validUntil: string; // ISO date
  locale: 'lv' | 'en' | 'ru';
  // A ritual card names the ritual; every card shows its value (a ritual's price).
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
  cardFront: 'giftcard/card_front.jpg',
  cardBack: 'giftcard/card_back.jpg',
  lightFront: 'giftcard/value_front.jpg',
  lightBack: 'giftcard/light_back.jpg',
  logoOnLight: 'giftcard/logo_on_light.png',
  a4Tub: 'giftcard/a4_tub.jpg',
  a4Whisk: 'giftcard/a4_whisk.jpg',
  a4Scrub: 'giftcard/a4_scrub.jpg',
  a4Swim: 'giftcard/a4_swim.jpg',
  a4Douse: 'giftcard/a4_douse.jpg',
  a4Wrap: 'giftcard/a4_wrap.jpg',
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

// The pictures' pixels to PDF points: 2000 px across 225 mm; the height is
// the card's 98 mm (the pictures are a hair shorter, and are drawn to fill it).
const W = 2000;
const PX = (225 / 25.4 * 72) / W;
const H = (98 / 25.4 * 72) / PX;
const IMAGE_H = 873;
// Picture y to page y: the picture is stretched by this much to fill the card.
const Y = H / IMAGE_H;

const hex = (h: string) => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
// The card's own gold, for the lines it fills in, and its softer gold footer.
const GOLD = hex('#FEDD58');
const GOLD_SOFT = hex('#AE9C47');

interface Text {
  font: PDFFont;
  size: number; // px
  color: RGB;
  spacing?: number; // letter-spacing, px
}

const width = (text: string, t: Text) =>
  t.font.widthOfTextAtSize(text, t.size) + (t.spacing ?? 0) * Math.max(0, [...text].length - 1);

// Draws one line with its baseline at y (picture px from the top), starting
// at x, centred on x or ending at x.
function line(page: PDFPage, text: string, x: number, y: number, t: Text, align: 'left' | 'center' | 'right' = 'left') {
  const w = width(text, t);
  const left = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  if (t.spacing) page.pushOperators(setCharacterSpacing(t.spacing * PX));
  page.drawText(text, { x: left * PX, y: (H - y * Y) * PX, size: t.size * PX, font: t.font, color: t.color });
  if (t.spacing) page.pushOperators(setCharacterSpacing(0));
  return w;
}

// The largest size, from `t.size` down to `min`, at which the text fits.
const fitted = (text: string, t: Text, max: number, min: number): Text => {
  let size = t.size;
  while (size > min && width(text, { ...t, size }) > max) size -= 0.5;
  return { ...t, size };
};

export async function renderGiftCardPdf(card: GiftCardData): Promise<Uint8Array> {
  const ritual = card.ritual;
  const w = giftCardWords[card.locale];
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(`${w.giftCard} ${card.code}`);
  doc.setSubject(ritual ? ritualName(ritual, card.locale) : `${card.value} EUR`);
  doc.setAuthor('SaimniekaPirts');
  doc.setLanguage({ lv: 'lv-LV', en: 'en-GB', ru: 'ru-RU' }[card.locale]);

  const [sans, sansBold, front, back] = await Promise.all([
    load('sans'), load('sansBold'), load('cardFront'), load('cardBack'),
  ]);
  const regular = await doc.embedFont(sans, { subset: true });
  const bold = await doc.embedFont(sansBold, { subset: true });
  const frontImage = await doc.embedJpg(front);
  const backImage = await doc.embedJpg(back);

  const pageFront = doc.addPage([W * PX, H * PX]);
  pageFront.drawImage(frontImage, { x: 0, y: 0, width: W * PX, height: H * PX });

  // The number, on its dotted line, and the code under it.
  line(pageFront, card.code, 1524, 243, fitted(card.code, { font: bold, size: 50, color: GOLD }, 336, 34));
  const labelWidth = line(pageFront, w.codeLine, 1524, 322, fitted(w.codeLine, { font: regular, size: 22, color: GOLD }, 300, 16));
  line(pageFront, card.pin, 1524 + labelWidth + 12, 322, { font: bold, size: 28, color: GOLD, spacing: 2 });

  // The amount and "vērtībā" on their dotted line.
  line(pageFront, `${card.value} EUR`, 955, 510, { font: bold, size: 68, color: GOLD }, 'center');
  line(pageFront, w.valueWord, 1280, 516, { font: bold, size: 36, color: GOLD });

  // The date on its dotted line.
  line(pageFront, formatCardDate(card.validUntil), 1418, 607, { font: bold, size: 50, color: GOLD });

  // What the card is for, and that a dearer service can be paid up on site.
  const usage = ritual ? w.ritualUsage(ritual) : w.usage;
  line(pageFront, usage, 1040, 680, fitted(usage, { font: regular, size: 26, color: GOLD, spacing: 0.5 }, 960, 18), 'center');
  line(pageFront, w.payMore, 1040, 714, fitted(w.payMore, { font: regular, size: 20, color: GOLD_SOFT, spacing: 0.5 }, 960, 15), 'center');

  // The footer: the address, and both ways to book.
  const footer = { font: regular, size: 20, color: GOLD_SOFT, spacing: 5 };
  line(pageFront, w.ribbonAddress, 1040, 766, fitted(w.ribbonAddress, footer, 1120, 14), 'center');
  line(pageFront, w.book, 1040, 798, fitted(w.book, footer, 1120, 14), 'center');

  const pageBack = doc.addPage([W * PX, H * PX]);
  pageBack.drawImage(backImage, { x: 0, y: 0, width: W * PX, height: H * PX });

  return await doc.save();
}
