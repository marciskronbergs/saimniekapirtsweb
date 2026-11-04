import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, type MotionValue, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import priceCatalog from '../../data/priceCatalog.json';

// A gift card drawn in the page, to buy one from: the ritual card (the guests
// in the herbal tub, on the site's forest green) or the card of a chosen value
// (the printed card's gold ribbon on its dark blue), 16:9. It leans a little
// toward the pointer with a soft light following it (the "3D card" pattern
// from 21st.dev, kept slight); the photo shifts a touch the other way. Its
// text is sized from the card's own width (cqw), so it reads the same at any
// size, with a floor under the small lines so they stay readable on a phone
// (where the one-line description gives way). The whole card is the link (or button) to the gift card page's form.

export type GiftCardKind = 'ritual' | 'value';

const LOGO = 'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/logo/logoTitle.png';

// The prices as the order form offers them.
const ritualPrices = priceCatalog.giftCard.rituals.map((r) => r.price);
const PRICE: Record<GiftCardKind, string> = {
  ritual: `${Math.min(...ritualPrices)}–${Math.max(...ritualPrices)} €`,
  value: `${priceCatalog.giftCard.custom.min}–${priceCatalog.giftCard.custom.max} €`,
};

// Where each card's order form is (DavanuKartesPage opens it from `forma`).
export const giftCardOrderPath = (kind: GiftCardKind) => `/davanu-kartes?forma=${kind === 'ritual' ? 'ritual' : 'custom'}`;

interface Props {
  kind: GiftCardKind;
  // Opens the order form here instead of going to the gift card page.
  onClick?: () => void;
  className?: string;
}

const GiftCardVisual: React.FC<Props> = ({ kind, onClick, className = '' }) => {
  const { t } = useTranslation('cards');
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  // The pointer over the card, 0–1 each way; 0.5 at rest. The tilt and the
  // light are kept slight: the card leans, it does not swing.
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const spring = { stiffness: 120, damping: 20, mass: 0.7 };
  const sx = useSpring(px, spring);
  const sy = useSpring(py, spring);
  const rotateY = useTransform(sx, [0, 1], reduced ? [0, 0] : [-4, 4]);
  const rotateX = useTransform(sy, [0, 1], reduced ? [0, 0] : [3, -3]);
  const shiftX = useTransform(sx, [0, 1], reduced ? [0, 0] : [4, -4]);
  const shiftY = useTransform(sy, [0, 1], reduced ? [0, 0] : [3, -3]);
  const glareX = useTransform(sx, (v) => `${v * 100}%`);
  const glareY = useTransform(sy, (v) => `${v * 100}%`);
  const glare = useMotionTemplate`radial-gradient(55% 70% at ${glareX} ${glareY}, rgba(255,255,255,0.14), transparent 65%)`;

  const move = (e: React.PointerEvent) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box || e.pointerType === 'touch') return;
    px.set((e.clientX - box.left) / box.width);
    py.set((e.clientY - box.top) / box.height);
  };
  const leave = () => {
    px.set(0.5);
    py.set(0.5);
  };

  const ritual = kind === 'ritual';
  const label = `${t('giftCard.eyebrow')} – ${t(`giftCard.${kind}.title`)}, ${PRICE[kind]}`;

  // The words: on the ritual card down its left over the green, with the
  // price and the button along the foot; on the value card in the dark blue
  // right of the bow, below the ribbon, the logo at the top of them.
  const words = (
    <>
      <p className={`text-[length:max(10.5px,2.1cqw)] font-semibold uppercase tracking-[0.3em] ${ritual ? 'text-green-400' : 'text-[#fedd58]/90'}`}>{t('giftCard.eyebrow')}</p>
      <p className="mt-[1.2cqw] text-[6.2cqw] font-extrabold leading-none tracking-tight text-white [text-shadow:0_4px_24px_rgba(0,0,0,0.5)]">
        {t(`giftCard.${kind}.title`)}
      </p>
      <p className="mt-[1.4cqw] text-[2.35cqw] leading-snug text-white/70 max-sm:hidden [text-shadow:0_2px_12px_rgba(0,0,0,0.7)]">{t(`giftCard.${kind}.text`)}</p>
    </>
  );
  const foot = (
    <div className="flex items-end justify-between gap-[3cqw]">
      <p
        className={`bg-clip-text text-[7cqw] font-black leading-none tracking-tight text-transparent tabular-nums ${
          ritual ? 'bg-gradient-to-b from-white to-green-300' : 'bg-gradient-to-b from-[#fff3b8] via-[#fedd58] to-[#c9a227]'
        }`}
      >
        {PRICE[kind]}
      </p>
      <span
        className={`inline-flex shrink-0 items-center gap-[1.2cqw] rounded-full px-[length:max(12px,3.2cqw)] py-[length:max(6px,1.5cqw)] text-[length:max(12.5px,2.6cqw)] font-semibold shadow-[0_10px_26px_-12px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.35)] transition-colors duration-300 ${
          ritual ? 'bg-green-600 text-white group-hover:bg-green-500' : 'bg-gradient-to-b from-[#ffe98a] to-[#d9b232] text-[#1b1606]'
        }`}
      >
        {t('giftCard.cta')}
        <ArrowRight aria-hidden className="h-[max(13px,2.9cqw)] w-[max(13px,2.9cqw)] transition-transform duration-300 group-hover:translate-x-[0.5cqw]" />
      </span>
    </div>
  );

  const card = (
    <div ref={ref} onPointerMove={move} onPointerLeave={leave} className="[container-type:inline-size] [perspective:1600px]">
      <motion.div
        style={{ rotateX, rotateY }}
        className={`relative aspect-[16/9] w-full overflow-hidden rounded-[4.5cqw] shadow-[0_40px_80px_-40px_rgba(0,0,0,0.95),0_20px_40px_-24px_rgba(0,0,0,0.8)] ring-1 transition-shadow duration-700 ${
          ritual
            ? 'bg-[#0b170d] ring-green-400/20 group-hover:shadow-[0_44px_90px_-40px_rgba(34,197,94,0.35),0_20px_40px_-24px_rgba(0,0,0,0.8)]'
            : 'bg-[#141d27] ring-[#fedd58]/20 group-hover:shadow-[0_44px_90px_-40px_rgba(254,221,88,0.3),0_20px_40px_-24px_rgba(0,0,0,0.8)]'
        }`}
      >
        {ritual ? <RitualArt shiftX={shiftX} shiftY={shiftY} /> : <ValueArt shiftX={shiftX} shiftY={shiftY} />}

        {ritual ? (
          <div className="absolute inset-0 flex flex-col p-[5cqw]">
            <img src={LOGO} alt="" aria-hidden loading="lazy" decoding="async" className="h-[max(14px,4.2cqw)] w-auto self-start drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]" />
            <div className="mt-auto w-[52%]">{words}</div>
            <div className="mt-[3.2cqw]">{foot}</div>
          </div>
        ) : (
          <div className="absolute inset-y-0 left-[39%] right-0 flex flex-col pb-[5cqw] pr-[5.5cqw] pt-[17.5cqw]">
            <img src={LOGO} alt="" aria-hidden loading="lazy" decoding="async" className="h-[max(13px,3.8cqw)] w-auto self-start drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]" />
            <div className="mt-[3.4cqw]">{words}</div>
            <div className="mt-auto">{foot}</div>
          </div>
        )}

        {/* A soft light where the pointer is. */}
        <motion.div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100" style={{ background: glare }} />
        {/* A fine edge, lighter at the top, as on a printed card's laminate. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_0_0_1px_rgba(255,255,255,0.05)]" />
      </motion.div>
    </div>
  );

  const classes = `group block w-full rounded-[2rem] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:ring-offset-black ${
    ritual ? 'focus-visible:ring-green-300' : 'focus-visible:ring-amber-300'
  } ${className}`;
  return onClick ? (
    <button type="button" onClick={onClick} aria-label={label} className={classes}>
      {card}
    </button>
  ) : (
    <Link to={giftCardOrderPath(kind)} aria-label={label} className={classes}>
      {card}
    </Link>
  );
};

type Shift = { shiftX: MotionValue<number>; shiftY: MotionValue<number> };

// The ritual card: the guests in the herbal tub on the right, fading into the
// site's dark forest green, a green glow from the top left.
const RitualArt: React.FC<Shift> = ({ shiftX, shiftY }) => (
  <>
    <motion.img
      src="/giftcard/value_front.jpg"
      alt=""
      aria-hidden
      loading="lazy"
      decoding="async"
      style={{ x: shiftX, y: shiftY, scale: 1.04 }}
      className="absolute inset-y-0 right-0 h-full w-[64%] object-cover object-[12%_60%]"
    />
    <div aria-hidden className="absolute inset-0 bg-[linear-gradient(90deg,#0b170d_34%,rgba(11,23,13,0.82)_46%,rgba(11,23,13,0.2)_72%,rgba(11,23,13,0)_100%)]" />
    <div aria-hidden className="absolute inset-0 bg-[linear-gradient(0deg,rgba(11,23,13,0.85)_0%,rgba(11,23,13,0)_38%)]" />
    <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_80%_at_0%_0%,rgba(34,197,94,0.18),transparent_65%)]" />
  </>
);

// The value card: the printed card's gold ribbon and bow over the top and
// left, its own words covered by the card's dark blue below the ribbon.
const ValueArt: React.FC<Shift> = ({ shiftX, shiftY }) => (
  <>
    <motion.img
      src="/giftcard/card_front.jpg"
      alt=""
      aria-hidden
      loading="lazy"
      decoding="async"
      style={{ x: shiftX, y: shiftY, scale: 1.03 }}
      className="absolute left-0 top-0 h-full w-auto max-w-none origin-top-left"
    />
    <div aria-hidden className="absolute bottom-0 left-[37%] right-0 top-[21.5%] bg-[linear-gradient(90deg,rgba(20,29,39,0)_0%,#141d27_13%)]" />
    <div aria-hidden className="absolute inset-0 bg-[radial-gradient(55%_65%_at_100%_100%,rgba(254,221,88,0.1),transparent_65%)]" />
  </>
);

export default GiftCardVisual;
