import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, type MotionValue, useAnimationFrame, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion';

// The bridge from the ritual's introduction into its steps: two rows of
// photographs flowing past in opposite directions. They drift on their own,
// slowly, and the page's scroll carries them further (through a spring, so
// they glide rather than jump). The band rises out of the right side: the
// photographs fade in from the right edge and fade out towards the left and
// into the sections above and below.
//
// Each row is its photographs twice over, so it wraps without a seam.
// Reduced motion shows the rows still.

// Ritual moments only (no sauna houses), WebP in public/media/rituals/gallery/:
// the n-* ones from the 2023–2026 shoots, the numbered ones copies of the
// Supabase bildes/<n>.png photos.
const BASE = '/media/rituals/gallery';
const ROW_A = ['n-grupas-pirts-pirtniece', 'n-kubls-grupa-2', '4', 'n-peldinasana-3', 'n-skrubis-2', 'n-slotas-ugunskurs-2', '31'];
const ROW_B = ['n-teja-kublaa-2', 'n-periens-2', '65', 'n-ietisana-2', 'n-apliesana-zalaja-1', 'n-medus-pirts-grupa', 'n-iesana-diki'];
// Drift, px per second, and how far a full pass of the band scrolls the rows.
const DRIFT = 18;
const SCROLL_REACH = 520;

const wrap = (v: number, len: number) => (len > 0 ? ((v % len) + len) % len : 0);

interface RowProps {
  images: string[];
  alt: string;
  // +1 flows to the left, -1 to the right.
  direction: 1 | -1;
  offset: MotionValue<number>;
  tall?: boolean;
}

const Row: React.FC<RowProps> = ({ images, alt, direction, offset, tall }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [half, setHalf] = useState(0);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => setHalf(el.scrollWidth / 2);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const x = useTransform(offset, (v) => -wrap(direction * v, half));

  return (
    <motion.div ref={trackRef} className="flex w-max gap-4 sm:gap-6 will-change-transform" style={{ x }}>
      {[...images, ...images].map((id, i) => (
        <figure
          key={i}
          aria-hidden={i >= images.length || undefined}
          className={`relative shrink-0 overflow-hidden rounded-2xl bg-neutral-900 ring-1 ring-white/10 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)] ${
            tall
              ? i % 2 ? 'h-56 w-44 sm:h-72 sm:w-56 lg:h-80 lg:w-64' : 'h-56 w-72 sm:h-72 sm:w-96 lg:h-80 lg:w-[26rem]'
              : i % 2 ? 'h-44 w-64 sm:h-56 sm:w-80 lg:h-64 lg:w-96' : 'h-44 w-36 sm:h-56 sm:w-44 lg:h-64 lg:w-52'
          }`}
        >
          <img
            src={`${BASE}/${id}.webp`}
            alt={i < images.length ? alt : ''}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="h-full w-full select-none object-cover transition-transform duration-[1200ms] ease-out hover:scale-105"
          />
          {/* A glass sheen on top, a little shade at the foot. */}
          <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/30" />
        </figure>
      ))}
    </motion.div>
  );
};

const RitualGalleryFlow = () => {
  const { t } = useTranslation('common');
  const sectionRef = useRef<HTMLElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  // The scroll's share, eased through a spring so the rows glide on and settle.
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] });
  const scrolled = useSpring(scrollYProgress, { stiffness: 60, damping: 22, mass: 0.6 });
  const drift = useMotionValue(0);
  const offset = useMotionValue(0);
  const onScreen = useRef(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => (onScreen.current = entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useAnimationFrame((_, delta) => {
    if (reduced || !onScreen.current) return;
    drift.set(drift.get() + (DRIFT * Math.min(delta, 64)) / 1000);
    offset.set(drift.get() + scrolled.get() * SCROLL_REACH);
  });

  return (
    <section
      ref={sectionRef}
      aria-label={t('imageAlt.ritual')}
      className="rgf relative -my-6 overflow-hidden py-10 sm:py-14"
    >
      <style>{CSS}</style>
      <div className="rgf-mask flex flex-col gap-4 sm:gap-6">
        <div className="rgf-row-a">
          <Row images={ROW_A} alt={t('imageAlt.ritual')} direction={1} offset={offset} tall />
        </div>
        <div className="rgf-row-b">
          <Row images={ROW_B} alt={t('imageAlt.ritual')} direction={-1} offset={offset} />
        </div>
      </div>
    </section>
  );
};

const CSS = `
/* Fades: out of the right side, gone towards the left, soft at top and bottom. */
.rgf-mask {
  -webkit-mask-image:
    linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.15) 14%, #000 46%, #000 88%, transparent 100%),
    linear-gradient(180deg, transparent 0%, #000 14%, #000 86%, transparent 100%);
  -webkit-mask-composite: source-in;
  mask-image:
    linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.15) 14%, #000 46%, #000 88%, transparent 100%),
    linear-gradient(180deg, transparent 0%, #000 14%, #000 86%, transparent 100%);
  mask-composite: intersect;
}
/* The rows sit staggered, the lower one further right. */
.rgf-row-b { margin-left: 12vw; }
@media (max-width: 767px) {
  .rgf-mask {
    -webkit-mask-image:
      linear-gradient(90deg, transparent 0%, #000 12%, #000 88%, transparent 100%),
      linear-gradient(180deg, transparent 0%, #000 12%, #000 88%, transparent 100%);
    mask-image:
      linear-gradient(90deg, transparent 0%, #000 12%, #000 88%, transparent 100%),
      linear-gradient(180deg, transparent 0%, #000 12%, #000 88%, transparent 100%);
  }
  .rgf-row-b { margin-left: 0; }
}
`;

export default RitualGalleryFlow;
