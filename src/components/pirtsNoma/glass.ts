import { useEffect, useRef, useState } from 'react';

// Shared pieces of the Pirts Noma page: the glass surfaces, the photos and
// the "rise in once" hook, so every section reads as one design.

// The rental photos, resized from the site's library into public/media/noma
// (square, 560 and 960 px).
export const nomaPhoto = (n: string, size: 560 | 960 = 960) => `/media/noma/${n}-${size}.webp`;
export const nomaSrcSet = (n: string) => `${nomaPhoto(n, 560)} 560w, ${nomaPhoto(n, 960)} 960w`;

// A frosted glass panel: a pale tint, a bright rim along the top, a deep soft shadow.
export const glassPanel =
  'bg-white/[0.07] ring-1 ring-white/15 backdrop-blur-2xl backdrop-saturate-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_40px_90px_-40px_rgba(0,0,0,0.9)]';
// Small glass chips and buttons over photos.
export const glassChip = 'bg-black/25 ring-1 ring-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] backdrop-blur-xl';
// The site's main button.
export const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-full bg-green-600 px-8 py-4 text-base sm:text-lg font-semibold text-white shadow-[0_12px_32px_-12px_rgba(34,197,94,0.8),inset_0_1px_0_rgba(255,255,255,0.35)] transition-colors hover:bg-green-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-green-300/60';
// A quieter glass button beside it.
export const ghostButton =
  'inline-flex items-center justify-center gap-2 rounded-full bg-white/[0.06] px-7 py-4 text-base sm:text-lg font-semibold text-white ring-1 ring-white/20 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] transition-colors hover:bg-white/[0.12] focus:outline-none focus-visible:ring-4 focus-visible:ring-green-300/60';
export const eyebrow = 'text-xs sm:text-sm font-semibold uppercase tracking-[0.22em] text-green-400';

// True once the element has come into view (and stays true).
export function useShown<T extends Element>(threshold = 0.15) {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, shown] as const;
}

// Classes and style for a part that rises in once `shown`, after `delay` ms.
export const rise = (shown: boolean, delay = 0) => ({
  className: `transition-all duration-700 ease-out motion-reduce:transition-none ${
    shown ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100'
  }`,
  style: { transitionDelay: shown ? `${delay}ms` : '0ms' },
});

// Opens the rental booking form, with a sauna or a rental (a price list
// label) already picked if given.
export const openRentalBooking = (choice?: string) =>
  (window as unknown as { openCustomPopup?: (type: 'noma', choice?: string) => void }).openCustomPopup?.('noma', choice);
