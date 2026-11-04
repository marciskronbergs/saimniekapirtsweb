import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight, BedDouble, ChevronLeft, ChevronRight } from 'lucide-react';
import { eyebrow, glassChip, glassPanel, primaryButton, rise, useShown } from './glass';

// "Nakšņošana" on the rental and rituals pages: one glass block, the words on
// the left, the rooms on the right as part of the block itself. The photos
// fill the block's right side to its edge and fade into the glass towards the
// words (upwards into them on phones).
//
// The rooms are a row the visitor can move through by hand: swiped on touch
// screens, scrolled sideways on a trackpad, dragged with the mouse, or with
// the arrows, the dots and the arrow keys; it snaps to one photo at a time.
// Left alone and on screen, it moves on by itself every few seconds; any
// touch pauses that for a while. Reduced motion: no turns and no drift.
//
// The words come from `ns` (the page's own namespace); the photo controls'
// labels from the rental page's.

const PHOTOS = ['attic2', 'herbroom', '58', 'kitchen'];
const stayPhoto = (n: string, size: 560 | 960) => `/media/noma/stay-${n}-${size}.webp`;
const TURN_MS = 5000;
// After the visitor moves the photos, they stay put this long.
const PAUSE_MS = 9000;
// A mouse drag this far (px) moves on one photo.
const DRAG_STEP = 40;

interface NomaStayProps {
  ns?: 'noma' | 'rituali';
  eyebrowKey?: string;
}

const NomaStay = ({ ns = 'noma', eyebrowKey = 'page.stayEyebrow' }: NomaStayProps) => {
  const { t } = useTranslation(ns);
  const { t: tNoma } = useTranslation('noma');
  const reduced = useReducedMotion();
  const [ref, shown] = useShown<HTMLElement>(0.2);
  const trackRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const [onScreen, setOnScreen] = useState(false);
  const pausedUntil = useRef(0);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);

  const go = (i: number, smooth = true) => {
    const track = trackRef.current;
    if (!track) return;
    const next = (i + PHOTOS.length) % PHOTOS.length;
    track.scrollTo({ left: next * track.clientWidth, behavior: smooth && !reduced ? 'smooth' : 'auto' });
  };
  const goByHand = (i: number) => {
    pausedUntil.current = Date.now() + PAUSE_MS;
    go(i);
  };

  // Which photo is in view, as the row scrolls (by hand or by itself).
  const onScroll = () => {
    const track = trackRef.current;
    if (!track || !track.clientWidth) return;
    const i = Math.round(track.scrollLeft / track.clientWidth);
    setCurrent((c) => (c === i ? c : i));
  };

  useEffect(() => {
    if (reduced || !onScreen) return;
    const timer = window.setInterval(() => {
      if (Date.now() < pausedUntil.current || drag.current) return;
      go(current + 1);
    }, TURN_MS);
    return () => window.clearInterval(timer);
    // go only reads refs and `reduced`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, onScreen, current]);

  // Keep the photo in view when the block changes width.
  const currentRef = useRef(current);
  currentRef.current = current;
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let width = track.clientWidth;
    const ro = new ResizeObserver(() => {
      if (track.clientWidth === width) return;
      width = track.clientWidth;
      go(currentRef.current, false);
    });
    ro.observe(track);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dragging with the mouse (touch and trackpads scroll natively).
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const track = e.currentTarget;
    drag.current = { x: e.clientX, left: track.scrollLeft, moved: false };
    track.setPointerCapture(e.pointerId);
    track.style.scrollSnapType = 'none';
    track.style.scrollBehavior = 'auto';
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 3) d.moved = true;
    e.currentTarget.scrollLeft = d.left - dx;
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    const track = e.currentTarget;
    track.style.scrollSnapType = '';
    track.style.scrollBehavior = '';
    const dx = e.clientX - d.x;
    const from = Math.round(d.left / track.clientWidth);
    goByHand(Math.abs(dx) > DRAG_STEP ? from + (dx < 0 ? 1 : -1) : from);
  };

  const arrow = (dir: 'prev' | 'next') => (
    <button
      type="button"
      onClick={() => goByHand(current + (dir === 'next' ? 1 : -1))}
      aria-label={tNoma(dir === 'next' ? 'page.nextPhoto' : 'page.prevPhoto')}
      className={`absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-white transition-opacity duration-300 hover:bg-black/40 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white lg:opacity-0 lg:group-hover/stay:opacity-100 ${glassChip} ${
        dir === 'prev' ? 'left-4 lg:left-[26%]' : 'right-4'
      }`}
    >
      {dir === 'prev' ? <ChevronLeft aria-hidden className="h-5 w-5" /> : <ChevronRight aria-hidden className="h-5 w-5" />}
    </button>
  );

  return (
    <section ref={ref} aria-labelledby="stay-heading" className="relative px-4 py-16 sm:px-6 sm:py-20">
      <style>{CSS}</style>
      <div
        style={rise(shown).style}
        className={`relative mx-auto grid max-w-6xl overflow-hidden rounded-[2.25rem] lg:min-h-[30rem] lg:grid-cols-[0.95fr_1.05fr] ${glassPanel} ${rise(shown).className}`}
      >
        {/* The rooms: the block's right side, fading into the glass. */}
        <div
          className="group/stay relative h-72 sm:h-96 lg:order-2 lg:h-auto"
          role="region"
          aria-roledescription="carousel"
          aria-label={t('accommodation.title')}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') goByHand(current + 1);
            if (e.key === 'ArrowLeft') goByHand(current - 1);
          }}
        >
          <div
            ref={trackRef}
            onScroll={onScroll}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onTouchStart={() => (pausedUntil.current = Date.now() + PAUSE_MS)}
            onWheel={(e) => {
              if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) pausedUntil.current = Date.now() + PAUSE_MS;
            }}
            className="ns-photos ns-track absolute inset-0 flex cursor-grab touch-pan-x touch-pan-y snap-x snap-mandatory overflow-x-auto overscroll-x-contain active:cursor-grabbing"
          >
            {PHOTOS.map((n, i) => (
              <div key={n} className="relative h-full w-full shrink-0 snap-center snap-always overflow-hidden">
                <img
                  src={stayPhoto(n, 960)}
                  srcSet={`${stayPhoto(n, 560)} 560w, ${stayPhoto(n, 960)} 960w`}
                  sizes="(min-width: 1024px) 55vw, 92vw"
                  alt={`${t('accommodation.title')} ${i + 1}/${PHOTOS.length}`}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  className={`pointer-events-none h-full w-full select-none object-cover ${i === current && !reduced ? 'ns-drift' : ''}`}
                />
              </div>
            ))}
          </div>
          {arrow('prev')}
          {arrow('next')}
          <div className={`absolute bottom-5 right-5 z-10 flex gap-1.5 rounded-full px-3 py-2 ${glassChip}`}>
            {PHOTOS.map((n, i) => (
              <button
                key={n}
                type="button"
                onClick={() => goByHand(i)}
                aria-label={tNoma('page.stayPhoto', { n: i + 1 })}
                aria-pressed={i === current}
                className={`h-2 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                  i === current ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </div>

        {/* The words. */}
        <div className="relative flex flex-col justify-center p-7 sm:p-10 lg:order-1 lg:p-14">
          <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-green-500/15 blur-3xl" />
          <span className={`relative flex h-14 w-14 items-center justify-center rounded-2xl ${glassChip}`}>
            <BedDouble className="h-6 w-6 text-green-200" aria-hidden strokeWidth={1.7} />
          </span>
          <p className={`relative mt-6 ${eyebrow}`}>{t(eyebrowKey)}</p>
          <h2 id="stay-heading" className="relative mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            {t('accommodation.title')}
          </h2>
          <p className="relative mt-4 max-w-md text-base leading-relaxed text-white/75 sm:text-lg">{t('accommodation.description')}</p>
          <div className="relative mt-8">
            <Link to="/naksnosana" className={`group ${primaryButton}`}>
              {t('accommodation.cta')}
              <ArrowRight aria-hidden className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

const CSS = `
.ns-track { scrollbar-width: none; scroll-behavior: smooth; }
.ns-track::-webkit-scrollbar { display: none; }
@media (prefers-reduced-motion: reduce) { .ns-track { scroll-behavior: auto; } }
/* Phones: the photos on top, fading down into the words. */
.ns-photos {
  -webkit-mask-image: linear-gradient(180deg, #000 0%, #000 55%, transparent 100%);
  mask-image: linear-gradient(180deg, #000 0%, #000 55%, transparent 100%);
}
/* Wide: the block's right side, fading left into the words. */
@media (min-width: 1024px) {
  .ns-photos {
    -webkit-mask-image: linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.55) 18%, #000 42%);
    mask-image: linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.55) 18%, #000 42%);
  }
}
/* The photo on show drifts slowly closer. */
.ns-drift { animation: ns-drift ${TURN_MS + 1400}ms linear both; }
@keyframes ns-drift { from { transform: scale(1); } to { transform: scale(1.08); } }
`;

export default NomaStay;
