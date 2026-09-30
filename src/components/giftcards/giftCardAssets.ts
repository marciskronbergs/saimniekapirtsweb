// The fonts and photos a gift card preview draws with: the same files the
// invoice function puts into the PDF (public/fonts/giftcard, public/giftcard).

const FONTS = [
  ['GC Serif', 'CormorantGaramond_500Medium_Italic', 500, 'italic'],
  ['GC Serif', 'CormorantGaramond_600SemiBold', 600, 'normal'],
  ['GC Sans', 'Montserrat_400Regular', 400, 'normal'],
  ['GC Sans', 'Montserrat_600SemiBold', 600, 'normal'],
] as const;
const fontUrl = (file: string) => `/fonts/giftcard/${file}.ttf`;

export const fontFaces = FONTS
  .map(([family, file, weight, style]) =>
    `@font-face{font-family:'${family}';src:url('${fontUrl(file)}') format('truetype');font-weight:${weight};font-style:${style};font-display:swap}`)
  .join('');

const PHOTOS = {
  value: ['/giftcard/value_front.jpg', '/giftcard/value_back.jpg', '/giftcard/logo_on_light.png'],
  ritual: ['/giftcard/ritual_front.jpg', '/giftcard/ritual_back.jpg', '/giftcard/logo_on_dark.png'],
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
    link.type = 'font/ttf';
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
