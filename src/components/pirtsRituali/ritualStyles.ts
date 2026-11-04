// Shared styles and helpers for the rituals page (see ritualUi.tsx).

export const EASE = [0.22, 1, 0.36, 1] as const;

// Opens the ritual booking form (App puts openCustomPopup on window), with a
// ritual (a price list label) already picked if one is given.
export const openRitualBooking = (ritualType?: string) =>
  (window as unknown as { openCustomPopup?: (type: 'noma' | 'ritual', choice?: string) => void }).openCustomPopup?.(
    'ritual',
    typeof ritualType === 'string' ? ritualType : undefined
  );

// Frosted glass on the dark page: a light sheet with a bright upper edge.
export const glass =
  'bg-white/[0.06] backdrop-blur-xl ring-1 ring-white/[0.12] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_24px_60px_-30px_rgba(0,0,0,0.85)]';
// The same, tinted with the site's green, for what should stand out.
export const glassGreen =
  'bg-gradient-to-b from-green-400/[0.14] to-green-900/[0.18] backdrop-blur-xl ring-1 ring-green-300/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_30px_70px_-30px_rgba(34, 197, 94,0.45)]';

export const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-full bg-green-600 px-7 py-3.5 text-base font-semibold text-white shadow-[0_12px_32px_-12px_rgba(34,197,94,0.8),inset_0_1px_0_rgba(255,255,255,0.35)] transition-colors hover:bg-green-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-green-300/60';
export const ghostButton =
  'inline-flex items-center justify-center gap-2 rounded-full bg-white/[0.07] px-7 py-3.5 text-base font-semibold text-white ring-1 ring-white/20 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] transition-[background-color,transform] duration-300 hover:bg-white/[0.14] active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40';
