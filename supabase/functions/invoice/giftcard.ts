// Draws a gift card as a two-page PDF, 225 × 98 mm, in the look of the cards
// the office used to make by hand in Canva: a dark card tied with a gold
// ribbon. The front says what the card is for, its number and until when it
// is valid; the back, with a photo, how to use it. It is in the language the
// order was placed in.

import { PDFDocument, rgb, setCharacterSpacing, type PDFFont, type PDFImage, type PDFPage, type RGB } from 'npm:pdf-lib@1.17.1';
import fontkit from 'npm:@pdf-lib/fontkit@1.1.1';

export interface GiftCardData {
  code: string;
  validUntil: string; // ISO date
  locale: 'lv' | 'en';
  // A ritual card names the ritual; a value card has only its value.
  ritual: { lv: string; en: string } | null;
  value: number;
}

// The fonts (public/fonts/giftcard, with their licence) and pictures
// (public/giftcard) live on the website, like the invoice font, and are
// fetched once per running instance.
const ASSET_BASE = Deno.env.get('GIFT_CARD_ASSET_BASE') ?? 'https://saimniekapirts.lv';
const FILES = {
  serif: 'fonts/giftcard/CormorantGaramond_500Medium.ttf',
  serifItalic: 'fonts/giftcard/CormorantGaramond_500Medium_Italic.ttf',
  serifBold: 'fonts/giftcard/CormorantGaramond_600SemiBold.ttf',
  sans: 'fonts/giftcard/Montserrat_400Regular.ttf',
  sansBold: 'fonts/giftcard/Montserrat_600SemiBold.ttf',
  ribbon: 'giftcard/ribbon.png',
  logo: 'giftcard/logo.png',
  photo: 'giftcard/back.jpg',
} as const;
type Assets = Record<keyof typeof FILES, ArrayBuffer>;
let assets: Promise<Assets> | null = null;

const loadAssets = () => {
  assets ??= Promise.all(
    Object.entries(FILES).map(async ([key, file]) => {
      const res = await fetch(`${ASSET_BASE}/${file}`);
      if (!res.ok) throw new Error(`Gift card ${file}: HTTP ${res.status}`);
      return [key, await res.arrayBuffer()] as const;
    })
  ).then((entries) => Object.fromEntries(entries) as Assets).catch((e) => {
    assets = null;
    throw e;
  });
  return assets;
};

const mm = (n: number) => (n * 72) / 25.4;
const W = mm(225);
const H = mm(98);

const navy = rgb(0.106, 0.149, 0.192);
const gold = rgb(0.84, 0.69, 0.33);
const goldLight = rgb(0.96, 0.87, 0.62);
const cream = rgb(0.93, 0.9, 0.83);
const muted = rgb(0.68, 0.7, 0.72);

const formatDate = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
};
const amount = (n: number, locale: 'lv' | 'en') => {
  const s = Number.isInteger(n) ? String(n) : n.toFixed(2).replace('.', locale === 'lv' ? ',' : '.');
  return locale === 'lv' ? `${s} EUR` : `€${s}`;
};

interface TextOptions {
  font: PDFFont;
  size: number;
  color?: RGB;
  spacing?: number;
  align?: 'left' | 'center' | 'right';
  opacity?: number;
}

function draw(page: PDFPage, text: string, x: number, y: number, o: TextOptions) {
  const spacing = o.spacing ?? 0;
  const width = o.font.widthOfTextAtSize(text, o.size) + spacing * Math.max(0, text.length - 1);
  const left = o.align === 'center' ? x - width / 2 : o.align === 'right' ? x - width : x;
  if (spacing) page.pushOperators(setCharacterSpacing(spacing));
  page.drawText(text, { x: left, y, size: o.size, font: o.font, color: o.color ?? cream, opacity: o.opacity });
  if (spacing) page.pushOperators(setCharacterSpacing(0));
  return width;
}

function wrap(text: string, font: PDFFont, size: number, width: number) {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && font.widthOfTextAtSize(next, size) > width) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// The largest size, up to `size`, at which the text fits the width.
const fit = (text: string, font: PDFFont, size: number, width: number) =>
  Math.min(size, (size * width) / font.widthOfTextAtSize(text, size));

function frame(page: PDFPage) {
  page.drawRectangle({
    x: 9, y: 9, width: W - 18, height: H - 18,
    borderColor: gold, borderWidth: 0.6, borderOpacity: 0.45,
  });
}

// A thin gold rule with a small diamond in the middle.
function ornament(page: PDFPage, cx: number, y: number, half: number) {
  page.drawLine({ start: { x: cx - half, y }, end: { x: cx - 7, y }, thickness: 0.6, color: gold });
  page.drawLine({ start: { x: cx + 7, y }, end: { x: cx + half, y }, thickness: 0.6, color: gold });
  page.drawSvgPath('M 0 -3.2 L 3.2 0 L 0 3.2 L -3.2 0 Z', { x: cx, y, color: gold });
}

const ADDRESS = {
  lv: '“SARMA NR. 123”, BALDONES PAGASTS, ĶEKAVAS NOVADS, LV-2125',
  en: '“SARMA NR. 123”, BALDONE PARISH, ĶEKAVA MUNICIPALITY, LV-2125, LATVIA',
};
const PHONE = '+371 26 752 661';
const EMAIL = 'info@saimniekapirts.lv';
const WEB = 'saimniekapirts.lv';

export async function renderGiftCardPdf(card: GiftCardData): Promise<Uint8Array> {
  const lv = card.locale === 'lv';
  const t = (a: string, b: string) => (lv ? a : b);
  const a = await loadAssets();

  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(t(`Dāvanu karte ${card.code}`, `Gift card ${card.code}`));
  doc.setAuthor('SaimniekaPirts');
  const [serif, serifItalic, serifBold, sans, sansBold] = await Promise.all(
    [a.serif, a.serifItalic, a.serifBold, a.sans, a.sansBold].map((f) => doc.embedFont(f, { subset: true }))
  );
  const [ribbon, logo, photo]: PDFImage[] = await Promise.all([
    doc.embedPng(a.ribbon), doc.embedPng(a.logo), doc.embedJpg(a.photo),
  ]);

  // ---- Front ---------------------------------------------------------------
  const front = doc.addPage([W, H]);
  front.drawRectangle({ x: 0, y: 0, width: W, height: H, color: navy });
  frame(front);
  // The ribbon crosses the card near its top and left edges, the bow at the
  // crossing, as on the hand-made cards.
  const ribbonWidth = 760;
  const ribbonHeight = (ribbon.height / ribbon.width) * ribbonWidth;
  front.drawImage(ribbon, { x: -118, y: H + 118 - ribbonHeight, width: ribbonWidth, height: ribbonHeight });

  const cx = 392;
  draw(front, t('DĀVANU KARTE', 'GIFT CARD'), cx, H - 90, { font: sansBold, size: 10, color: gold, spacing: 4.2, align: 'center' });
  draw(front, t('Pirts priekiem', 'A sauna treat'), cx, H - 130, { font: serifItalic, size: 40, color: goldLight, align: 'center' });
  ornament(front, cx, H - 144, 92);

  if (card.ritual) {
    const name = card.ritual[card.locale];
    const size = fit(name, serif, 19, 300);
    draw(front, name, cx, H - 168, { font: serif, size, color: cream, align: 'center' });
    draw(front, t(`vērtība ${amount(card.value, 'lv')}`, `value ${amount(card.value, 'en')}`).toUpperCase(), cx, H - 184, {
      font: sans, size: 7.5, color: muted, spacing: 1.6, align: 'center',
    });
  } else {
    const big = amount(card.value, card.locale);
    const small = t('vērtībā', 'in value');
    const bigWidth = serifBold.widthOfTextAtSize(big, 36);
    const smallWidth = sans.widthOfTextAtSize(small, 9) + 6;
    const start = cx - (bigWidth + smallWidth) / 2;
    draw(front, big, start, H - 180, { font: serifBold, size: 36, color: goldLight });
    draw(front, small, start + bigWidth + 6, H - 180, { font: sans, size: 9, color: muted });
  }

  // Number and validity, side by side.
  const colGap = 82;
  front.drawLine({ start: { x: cx, y: 36 }, end: { x: cx, y: 62 }, thickness: 0.5, color: gold, opacity: 0.6 });
  for (const [x, label, value] of [
    [cx - colGap, t('NR.', 'NO.'), card.code],
    [cx + colGap, t('DERĪGA LĪDZ', 'VALID UNTIL'), formatDate(card.validUntil)],
  ] as const) {
    draw(front, label, x, 54, { font: sans, size: 6.5, color: muted, spacing: 2, align: 'center' });
    draw(front, value, x, 38, { font: sansBold, size: 12, color: goldLight, spacing: 0.6, align: 'center' });
  }

  front.drawImage(logo, { x: W - 9 - 92, y: 17, width: 88, height: 88 });
  draw(front, `${ADDRESS[card.locale]}  ·  ${WEB.toUpperCase()}  ·  ${PHONE}`, 312, 17, {
    font: sans, size: 5.4, color: muted, spacing: 0.9, align: 'center',
  });

  // ---- Back ----------------------------------------------------------------
  const back = doc.addPage([W, H]);
  back.drawRectangle({ x: 0, y: 0, width: W, height: H, color: navy });
  // The photo's right edge already fades into the card's colour.
  back.drawImage(photo, { x: 0, y: 0, width: 290, height: H });
  frame(back);

  back.drawImage(logo, { x: W - 20 - 62, y: H - 20 - 62, width: 62, height: 62 });
  const left = 300;
  const textWidth = W - 24 - left;
  let y = H - 62;
  draw(back, t('Kā izmantot dāvanu karti', 'How to use your gift card'), left, y, { font: serifItalic, size: 23, color: goldLight });
  y -= 10;
  back.drawLine({ start: { x: left, y }, end: { x: left + 64, y }, thickness: 0.7, color: gold });
  y -= 24;

  const stepsText = [
    t(`Piesakiet apmeklējumu, zvanot ${PHONE} vai rakstot uz ${EMAIL}, un nosauciet dāvanu kartes numuru.`,
      `Book your visit by calling ${PHONE} or writing to ${EMAIL}, quoting the gift card number.`),
    t('Vienosimies par Jums ērtu dienu un laiku.', 'We will agree on a day and time that suits you.'),
    t('Ierodoties uzrādiet dāvanu karti – izdrukātu vai telefonā.', 'Show the gift card when you arrive – printed or on your phone.'),
  ];
  const lineHeight = 12;
  stepsText.forEach((step, i) => {
    back.drawCircle({ x: left + 6, y: y + 3, size: 6.5, borderColor: gold, borderWidth: 0.7 });
    draw(back, String(i + 1), left + 6, y + 0.4, { font: sansBold, size: 7.5, color: gold, align: 'center' });
    for (const line of wrap(step, sans, 8.6, textWidth - 20)) {
      draw(back, line, left + 20, y, { font: sans, size: 8.6, color: cream });
      y -= lineHeight;
    }
    y -= 7;
  });

  y -= 6;
  const notes = [
    card.ritual
      ? t(`Dāvanu karte paredzēta: ${card.ritual.lv}.`, `This gift card is for: ${card.ritual.en}.`)
      : t('Kartes vērtību var izmantot jebkuram mūsu pakalpojumam – pirts rituālam, pirts nomai vai papildu pakalpojumiem.',
        'The value can be used for any of our services – a sauna ritual, sauna rental or extras.'),
    t(`Nr. ${card.code}, derīga līdz ${formatDate(card.validUntil)}. Dāvanu karte nav apmaināma pret naudu.`,
      `No. ${card.code}, valid until ${formatDate(card.validUntil)}. The gift card cannot be exchanged for cash.`),
  ];
  for (const note of notes) {
    for (const line of wrap(note, sans, 7.2, textWidth)) {
      draw(back, line, left, y, { font: sans, size: 7.2, color: muted });
      y -= 10;
    }
  }

  draw(back, `${PHONE}   ·   ${EMAIL}   ·   ${WEB}`, left, 32, { font: sansBold, size: 7.2, color: gold, spacing: 0.3 });
  draw(back, ADDRESS[card.locale], left, 18, { font: sans, size: 5.4, color: muted, spacing: 0.6 });

  return await doc.save();
}
