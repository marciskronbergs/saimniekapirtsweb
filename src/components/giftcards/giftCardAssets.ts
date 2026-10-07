// The fonts and photos a gift card preview draws with: the same typefaces the
// invoice function puts into the PDF, as small woff2 subsets
// (public/fonts/giftcard/web), and the same photos (public/giftcard).

const FONTS = [
  ['GC Serif', 'CormorantGaramond_500Medium_Italic', 500, 'italic'],
  ['GC Serif', 'CormorantGaramond_600SemiBold', 600, 'normal'],
  ['GC Sans', 'Montserrat_400Regular', 400, 'normal'],
  ['GC Sans', 'Montserrat_600SemiBold', 600, 'normal'],
] as const;
const fontUrl = (file: string) => `/fonts/giftcard/web/${file}.woff2`;

export const fontFaces = FONTS
  .map(([family, file, weight, style]) =>
    `@font-face{font-family:'${family}';src:url('${fontUrl(file)}') format('woff2');font-weight:${weight};font-style:${style};font-display:swap}`)
  .join('');

const CARDS = ['/giftcard/card_front.jpg', '/giftcard/card_back.jpg', '/giftcard/value_front.jpg', '/giftcard/light_back.jpg', '/giftcard/logo_on_light.png'];
const PHOTOS = {
  value: CARDS,
  ritual: [
    ...CARDS,
    // The A4 version.
    '/giftcard/a4_tub.jpg', '/giftcard/a4_whisk.jpg', '/giftcard/a4_scrub.jpg',
    '/giftcard/a4_swim.jpg', '/giftcard/a4_douse.jpg', '/giftcard/a4_wrap.jpg',
  ],
};
const preloaded = new Set<string>();

// Starts fetching a card's fonts and photos (once each), so the preview opens
// complete: the gift card page calls it when a form opens.
export function preloadGiftCard(kind: 'value' | 'ritual') {
  for (const [, file] of FONTS) {
    const href = fontUrl(file);
    if (preloaded.has(href)) continue;
    preloaded.add(href);
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    link.href = href;
    document.head.appendChild(link);
  }
  for (const src of PHOTOS[kind]) {
    if (preloaded.has(src)) continue;
    preloaded.add(src);
    new Image().src = src;
  }
}
