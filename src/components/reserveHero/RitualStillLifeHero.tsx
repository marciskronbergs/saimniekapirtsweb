import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useMotionValue, useReducedMotion, type Variants } from 'framer-motion';
import GlassTitle from '../glass/GlassTitle';
import { GLASS_FONT, useGlassFont } from '../glass/glassFont';
import { coverBox, layoutStillLife, SIZE, type Box } from './stillLifeLayout';

// The reservation page's hero: a forest still life of the ritual's
// ingredients on a mossy log (honey, herbal salt, dried herbs, a birch whisk,
// a honey dipper), the heading in the homepage's glass lettering, and one
// button down to the booking choices, which the page draws over the stage's
// darkening lower edge (OVERLAP_CLASS).
//
// Each object is its own cut-out picture, placed by stillLifeLayout.ts. Once
// every picture has loaded and decoded, the scene plays one entrance of about
// 1.2 s (framer-motion); nothing shows half-assembled before that. If the
// pictures are slow or one fails, a single flattened still of the same scene
// is shown instead and stays.
//
// Every layer sits in nested wrappers, each with one job: layout (position
// and size), scroll, pointer, entrance. Scroll and pointer are written
// straight onto their wrappers in requestAnimationFrame; React does not
// re-render while the visitor scrolls or moves the mouse. The objects resting
// on the log move as one group, so they stay on the moss.
//
// Reduced motion gets the finished composition with no entrance, parallax or
// scroll effect; touch screens get no pointer parallax.

const MEDIA = '/media/reserve-hero';
const src = (name: string, w: number) => `${MEDIA}/${name}-${w}.webp`;
const LAYERS = {
  forest: [960, 1672],
  log: [900, 1600],
  whisk: [640, 1100],
  honey: [560, 900],
  salt: [400, 640],
  herbs: [400, 640],
  dipper: [400, 640],
  foliage: [960, 1672],
} as const;
type Layer = keyof typeof LAYERS;
const LAYER_NAMES = Object.keys(LAYERS) as Layer[];
// The same scene flattened (scripts/reserve-hero-master.mjs).
const MASTER = { wide: `${MEDIA}/master-wide.webp`, tall: `${MEDIA}/master-tall.webp` };

// The header bar above the hero (HeaderSection) below lg; from lg the bar
// keeps out of the way at the top and the hero starts at the very top.
const BAR = 68;
// The stage runs on below the scene by this much (the --tail of .rsl-section),
// darkening into the page: the booking choices are drawn over it
// (OVERLAP_CLASS on the section that follows).
const TAIL = { wide: 240, tall: 130 };
export const OVERLAP_CLASS = 'rsl-after';
// Waiting longer than this for the pictures, the flattened still is fetched;
// longer than FALLBACK_AFTER, it is shown instead of the layers.
const SLOW_AFTER = 1200;
const FALLBACK_AFTER = 3200;
const EASE = [0.22, 1, 0.36, 1] as const;

// Parallax reach in CSS pixels at the pointer's furthest, back to front.
const DEPTH = { forest: 4, ground: 8, foliage: 15, whiskTurn: 0.5, dipper: 3 };
// How far each layer travels against the page as the hero scrolls away, as a
// share of the hero's height: the forest lags most, the foliage leads.
const SCROLL = { forest: 0.22, ground: 0.08, foliage: -0.06, title: 0.16, copy: 0.1 };

const srcSetOf = (name: Layer) => LAYERS[name].map((w) => `${src(name, w)} ${w}w`).join(', ');

// Splits a heading over two lines of about equal length.
const splitLines = (text: string): string[] => {
  const words = text.split(' ');
  if (words.length < 2) return [text];
  let best = 1;
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const diff = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
};

// The widest of `lines` at 100px in the glass face.
const measureLines = (lines: string[]): number => {
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return 0;
  ctx.font = `800 100px ${GLASS_FONT}`;
  return Math.max(...lines.map((l) => ctx.measureText(l).width));
};

const rise = (delay: number, y = 28, extra: Record<string, number> = {}): Variants => ({
  hidden: { opacity: 0, y, ...extra },
  shown: {
    opacity: 1,
    y: 0,
    ...Object.fromEntries(Object.keys(extra).map((k) => [k, k === 'scale' ? 1 : 0])),
    transition: { delay, duration: 0.85, ease: EASE, opacity: { delay, duration: 0.5, ease: 'easeOut' } },
  },
});

const V = {
  forest: {
    hidden: { opacity: 0, scale: 1.025 },
    shown: { opacity: 1, scale: 1, transition: { duration: 1.2, ease: EASE, opacity: { duration: 0.45, ease: 'easeOut' } } },
  } as Variants,
  log: rise(0.08, 34),
  whisk: rise(0.16, 26, { rotate: 2.5 }),
  honey: rise(0.24, 28),
  salt: rise(0.3, 22),
  herbs: rise(0.34, 22),
  dipper: rise(0.42, 20, { rotate: -2 }),
  foliage: {
    hidden: { opacity: 0, scale: 1.03 },
    shown: { opacity: 1, scale: 1, transition: { delay: 0.1, duration: 1.1, ease: EASE, opacity: { delay: 0.1, duration: 0.6 } } },
  } as Variants,
  title: {
    hidden: { opacity: 0, y: 18 },
    shown: { opacity: 1, y: 0, transition: { delay: 0.34, duration: 0.8, ease: EASE } },
  } as Variants,
  copy: {
    hidden: { opacity: 0, y: 14 },
    shown: { opacity: 1, y: 0, transition: { delay: 0.62, duration: 0.6, ease: EASE } },
  } as Variants,
  master: {
    hidden: { opacity: 0 },
    shown: { opacity: 1, transition: { duration: 0.6 } },
  } as Variants,
};

const boxStyle = (b: Box): React.CSSProperties => ({ left: b.x, top: b.y, width: b.w, height: b.h });

export interface RitualStillLifeHeroProps {
  // Takes the visitor to the booking choices (and their focus).
  onChooseDate: () => void;
}

const RitualStillLifeHero: React.FC<RitualStillLifeHeroProps> = ({ onChooseDate }) => {
  const { t } = useTranslation('reserve');
  const reduced = useReducedMotion() ?? false;
  const fontVersion = useGlassFont();

  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState({ W: 0, H: 0, tail: 0 });

  // Loading: every layer, then one entrance. Or the flattened still.
  const loaded = useRef(new Set<Layer>());
  const [ready, setReady] = useState(false);
  const [slow, setSlow] = useState(false);
  const [fallback, setFallback] = useState(false);
  const settled = ready || fallback;

  // The scroll and pointer wrappers.
  const scrollRefs = {
    forest: useRef<HTMLDivElement>(null),
    ground: useRef<HTMLDivElement>(null),
    foliage: useRef<HTMLDivElement>(null),
    title: useRef<HTMLDivElement>(null),
    copy: useRef<HTMLDivElement>(null),
  };
  const pointerRefs = {
    forest: useRef<HTMLDivElement>(null),
    ground: useRef<HTMLDivElement>(null),
    foliage: useRef<HTMLDivElement>(null),
    whisk: useRef<HTMLDivElement>(null),
    dipper: useRef<HTMLDivElement>(null),
  };
  // Keeps the forest inside the glass letters aligned with the forest behind.
  const glassX = useMotionValue(0);
  const glassY = useMotionValue(0);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const tail = parseFloat(getComputedStyle(el).getPropertyValue('--tail')) || 0;
      setStage({ W: el.clientWidth, H: el.clientHeight, tail });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onLoaded = useCallback((name: Layer, img: HTMLImageElement | null, failed = false) => {
    if (failed) {
      setFallback(true);
      return;
    }
    if (loaded.current.has(name)) return;
    const done = () => {
      loaded.current.add(name);
      if (loaded.current.size === LAYER_NAMES.length) setReady(true);
    };
    if (img?.decode) img.decode().then(done, done);
    else done();
  }, []);

  useEffect(() => {
    if (ready) return;
    const slowTimer = window.setTimeout(() => setSlow(true), SLOW_AFTER);
    const fallbackTimer = window.setTimeout(() => setFallback(true), FALLBACK_AFTER);
    return () => {
      window.clearTimeout(slowTimer);
      window.clearTimeout(fallbackTimer);
    };
  }, [ready]);

  // Scroll and pointer depth, in one damped animation frame loop that only
  // runs while something is still moving and the hero is on screen.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || reduced) return;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const portrait = stage.W / Math.max(1, stage.H - stage.tail) < 1.05;
    const usePointer = finePointer && !portrait;
    const titleRate = portrait ? SCROLL.forest : SCROLL.title;

    let raf = 0;
    let last = 0;
    let onScreen = true;
    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };

    const write = (el: HTMLDivElement | null, transform: string) => {
      if (el) el.style.transform = transform;
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const k = 1 - Math.exp(-dt * 5);
      cur.x += (target.x - cur.x) * k;
      cur.y += (target.y - cur.y) * k;

      const h = section.offsetHeight;
      const p = Math.min(1, Math.max(0, -section.getBoundingClientRect().top / h));
      const s = (rate: number) => `translate3d(0, ${(p * h * rate).toFixed(1)}px, 0)`;
      write(scrollRefs.forest.current, s(SCROLL.forest));
      write(scrollRefs.ground.current, s(SCROLL.ground));
      write(scrollRefs.foliage.current, s(SCROLL.foliage));
      // Upright screens keep the heading with the forest, so the refraction
      // inside the letters never has to be redrawn while scrolling.
      write(scrollRefs.title.current, s(titleRate));
      write(scrollRefs.copy.current, s(SCROLL.copy));
      if (scrollRefs.title.current) scrollRefs.title.current.style.opacity = String(Math.max(0, 1 - p * 2.2));
      if (scrollRefs.copy.current) scrollRefs.copy.current.style.opacity = String(Math.max(0, 1 - p * 2));

      const m = (d: number) => `translate3d(${(-cur.x * d).toFixed(2)}px, ${(-cur.y * d).toFixed(2)}px, 0)`;
      write(pointerRefs.forest.current, m(DEPTH.forest));
      write(pointerRefs.ground.current, m(DEPTH.ground));
      write(pointerRefs.foliage.current, m(DEPTH.foliage));
      write(pointerRefs.whisk.current, `rotate(${(cur.x * DEPTH.whiskTurn).toFixed(3)}deg)`);
      write(pointerRefs.dipper.current, `translate3d(${(-cur.x * DEPTH.dipper).toFixed(2)}px, ${(cur.y * DEPTH.dipper * 0.6).toFixed(2)}px, 0) rotate(${(cur.x * 0.6).toFixed(3)}deg)`);

      if (!portrait) {
        glassX.set(-cur.x * DEPTH.forest);
        glassY.set(p * h * (SCROLL.forest - titleRate) - cur.y * DEPTH.forest);
      }

      const moving = Math.abs(target.x - cur.x) > 0.002 || Math.abs(target.y - cur.y) > 0.002;
      if (moving && onScreen) raf = requestAnimationFrame(frame);
      else last = 0;
    };
    const request = () => {
      if (!raf && onScreen) raf = requestAnimationFrame(frame);
    };

    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      target.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.y = (e.clientY / window.innerHeight - 0.5) * 2;
      request();
    };
    const onLeave = () => {
      target.x = 0;
      target.y = 0;
      request();
    };
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      request();
    });
    io.observe(section);
    window.addEventListener('scroll', request, { passive: true });
    if (usePointer) {
      window.addEventListener('pointermove', onPointer, { passive: true });
      document.documentElement.addEventListener('pointerleave', onLeave);
    }
    request();

    const refs = [...Object.values(scrollRefs), ...Object.values(pointerRefs)];
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('scroll', request);
      window.removeEventListener('pointermove', onPointer);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      refs.forEach((r) => {
        if (r.current) {
          r.current.style.transform = '';
          r.current.style.opacity = '';
        }
      });
      glassX.set(0);
      glassY.set(0);
    };
    // The refs are stable; the loop restarts when the composition changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, stage.W, stage.H, stage.tail, glassX, glassY]);

  // Entrance props: reduced motion starts finished.
  const enter = (variants: Variants, show = settled) =>
    reduced
      ? {
          variants: { hidden: variants.hidden, shown: { ...(variants.shown as object), transition: { duration: 0 } } } as Variants,
          initial: false as const,
          animate: show ? 'shown' : 'hidden',
        }
      : { variants, initial: 'hidden', animate: show ? 'shown' : 'hidden' };

  // The scene is laid out above the tail; the forest fills the whole stage.
  const { W, H } = stage;
  const sceneH = H - stage.tail;
  const L = W > 0 ? { ...layoutStillLife(W, sceneH), forest: { x: -W * 0.03, y: -H * 0.03, w: W * 1.06, h: H * 1.06 } } : null;
  const layersVisible = ready && !fallback;

  // The heading: one line on wide screens, two on upright ones, all lines
  // the same size.
  const heading = t('hero.title');
  const lines = L?.title.lines === 2 ? splitLines(heading) : [heading];
  const [lineWidth, setLineWidth] = useState(0);
  useLayoutEffect(() => setLineWidth(measureLines(lines)), [heading, L?.title.lines, fontVersion]); // eslint-disable-line react-hooks/exhaustive-deps
  const titleSize = L && lineWidth > 0 ? Math.min(L.title.maxSize, ((L.title.right - L.title.left) / lineWidth) * 100) : 0;
  const lineGap = titleSize * 0.92;
  const baseline0 = L ? L.title.top + titleSize * 0.74 : 0;
  const copyTop = baseline0 + lineGap * (lines.length - 1) + titleSize * 0.16 + (L?.portrait ? 16 : 18);

  const forestFocus = L?.portrait ? 0.34 : 0.5;
  const glassBox = L ? coverBox(L.forest, SIZE.forest, forestFocus, 0.5) : null;

  const img = (name: Layer, box: Box, className = '') => (
    <img
      ref={(el) => {
        if (el?.complete && el.naturalWidth > 0) onLoaded(name, el);
      }}
      src={src(name, LAYERS[name][1])}
      srcSet={srcSetOf(name)}
      sizes={`${Math.ceil(box.w)}px`}
      alt=""
      draggable={false}
      decoding="async"
      {...(name === 'forest' || name === 'honey' ? { fetchpriority: 'high' } : {})}
      onLoad={(e) => onLoaded(name, e.currentTarget)}
      onError={() => onLoaded(name, null, true)}
      className={`block h-full w-full select-none ${className}`}
    />
  );

  // A soft shadow where a bowl meets the moss.
  const contact = (spread = 0.86) => (
    <span
      aria-hidden
      className="pointer-events-none absolute left-1/2 -translate-x-1/2"
      style={{
        bottom: '-4%',
        width: `${spread * 100}%`,
        height: '22%',
        background: 'radial-gradient(closest-side, rgba(8,12,5,0.72), rgba(8,12,5,0.38) 55%, transparent)',
        filter: 'blur(4px)',
      }}
    />
  );

  return (
    <section
      ref={sectionRef}
      aria-labelledby="reserve-hero-heading"
      className="rsl-section relative isolate overflow-hidden bg-[#0a0a0a]"
    >
      <style>{CSS}</style>
      <div ref={stageRef} className="absolute inset-0 overflow-hidden bg-[#13200f]">
        {L && (
          <>
            {/* The forest. */}
            <div ref={scrollRefs.forest} aria-hidden className="absolute inset-0 will-change-transform">
              <div ref={pointerRefs.forest} className="absolute inset-0">
                <motion.div className="absolute" style={boxStyle(L.forest)} {...enter(V.forest, settled)}>
                  {img('forest', L.forest, 'object-cover')}
                </motion.div>
              </div>
            </div>


            {/* The flattened still, if the layers are slow or one fails. */}
            {(slow || fallback) && !layersVisible && (
              <motion.img
                aria-hidden
                src={L.portrait ? MASTER.tall : MASTER.wide}
                alt=""
                decoding="async"
                // Without the still either, show what has loaded.
                onError={() => {
                  setFallback(false);
                  setReady(true);
                }}
                className="absolute inset-x-0 top-0 w-full object-cover object-bottom"
                style={{ height: sceneH }}
                variants={V.master}
                initial={reduced ? false : 'hidden'}
                animate={fallback ? 'shown' : 'hidden'}
              />
            )}

            {/* Shade for the heading and the bar above, deepest at the top. */}
            <div aria-hidden className={`rsl-tint pointer-events-none absolute inset-0 ${L.portrait ? 'is-portrait' : ''}`} />

            {/* The heading, in glass. Behind the whisk's leaves. */}
            <div ref={scrollRefs.title} aria-hidden className="absolute inset-0 z-10 will-change-transform">
              {titleSize > 0 && glassBox && (
                <motion.div className="absolute inset-0" style={{ transformOrigin: '50% 20%' }} {...enter(V.title)}>
                  {lines.map((line, i) => (
                    <GlassTitle
                      key={`${line}-${i}`}
                      text={line}
                      width={W}
                      height={H}
                      left={L.title.left}
                      right={L.title.right}
                      baseline={baseline0 + lineGap * i}
                      maxSize={titleSize}
                      glass={{ src: src('forest', 960), ...glassBox }}
                      glassStyle={{ x: glassX, y: glassY }}
                    />
                  ))}
                </motion.div>
              )}
            </div>

            {/* The log and everything resting on it, moving as one. */}
            <div
              ref={scrollRefs.ground}
              aria-hidden
              className="absolute inset-0 z-20 will-change-transform"
              style={{ visibility: fallback ? 'hidden' : 'visible' }}
            >
              <div ref={pointerRefs.ground} className="absolute inset-0">
                <motion.div className="absolute" style={boxStyle(L.log)} {...enter(V.log)}>
                  {img('log', L.log, 'rsl-log')}
                </motion.div>
                <div className="absolute" style={boxStyle(L.whisk)}>
                  <div ref={pointerRefs.whisk} className="h-full w-full" style={{ transformOrigin: '8% 92%' }}>
                    <motion.div className="h-full w-full" style={{ transformOrigin: '8% 92%' }} {...enter(V.whisk)}>
                      {img('whisk', L.whisk, 'rsl-whisk')}
                    </motion.div>
                  </div>
                </div>
                <motion.div className="absolute" style={boxStyle(L.honey)} {...enter(V.honey)}>
                  {contact(0.9)}
                  {img('honey', L.honey, 'relative')}
                </motion.div>
                <motion.div className="absolute" style={boxStyle(L.salt)} {...enter(V.salt)}>
                  {contact()}
                  {img('salt', L.salt, 'relative')}
                </motion.div>
                <motion.div className="absolute" style={boxStyle(L.herbs)} {...enter(V.herbs)}>
                  {contact()}
                  {img('herbs', L.herbs, 'relative')}
                </motion.div>
                <div className="absolute" style={boxStyle(L.dipper)}>
                  <div ref={pointerRefs.dipper} className="h-full w-full" style={{ transformOrigin: '90% 98%' }}>
                    <motion.div className="h-full w-full" style={{ transformOrigin: '90% 98%' }} {...enter(V.dipper)}>
                      {img('dipper', L.dipper, 'rsl-dipper')}
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>

            {/* The leaves in front, framing the corners. */}
            <div
              ref={scrollRefs.foliage}
              aria-hidden
              className="absolute inset-0 z-30 will-change-transform"
              style={{ visibility: fallback ? 'hidden' : 'visible' }}
            >
              <div ref={pointerRefs.foliage} className="absolute inset-0">
                <motion.div className="absolute" style={boxStyle(L.foliage)} {...enter(V.foliage)}>
                  {img('foliage', L.foliage, 'rsl-foliage')}
                </motion.div>
              </div>
            </div>

            {/* Warm light from the upper left, and the fade into the page below. */}
            <div aria-hidden className="rsl-light pointer-events-none absolute inset-0 z-30" />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 z-30"
              style={{
                height: stage.tail + sceneH * 0.16,
                background: 'linear-gradient(180deg, transparent 0%, rgba(10,10,10,0.55) 34%, rgba(10,10,10,0.86) 64%, #0a0a0a 100%)',
              }}
            />
          </>
        )}

        {/* The heading for assistive technology; the glass letters are decoration. */}
        <h1 id="reserve-hero-heading" className="sr-only">
          {heading}
        </h1>
        <span className="sr-only" role="img" aria-label={t('hero.alt')} />

        {/* The words and the button, above every picture. */}
        <div
          ref={scrollRefs.copy}
          className="absolute inset-x-0 z-40 px-5 will-change-transform"
          style={{ top: L && titleSize > 0 ? copyTop : '30%' }}
        >
          <motion.div
            className="mx-auto flex max-w-xl flex-col items-center text-center focus-within:!opacity-100"
            {...enter(V.copy, settled || reduced)}
          >
            <p className="rsl-copy text-[1.05rem] leading-relaxed text-white/90 sm:text-xl">{t('hero.subtitle')}</p>
            <button
              type="button"
              onClick={onChooseDate}
              className="mt-5 inline-flex items-center rounded-full bg-green-600 px-7 py-3.5 text-lg font-semibold text-white shadow-[0_12px_32px_-12px_rgba(34,197,94,0.8),inset_0_1px_0_rgba(255,255,255,0.35)] transition-colors hover:bg-green-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-green-300/60 sm:mt-7 sm:px-9 sm:py-4 sm:text-xl"
            >
              {t('hero.cta')}
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const CSS = `
.rsl-section {
  --bar: ${BAR}px; --tail: ${TAIL.wide}px;
  margin-top: var(--bar);
  height: calc(100vh - var(--bar) + var(--tail)); height: calc(100svh - var(--bar) + var(--tail));
  min-height: calc(560px + var(--tail)); max-height: calc(1080px + var(--tail));
}
@media (min-width: 1024px) { .rsl-section { --bar: 0px; } }
@media (orientation: portrait) {
  .rsl-section { --tail: ${TAIL.tall}px; min-height: calc(620px + var(--tail)); max-height: calc(920px + var(--tail)); }
}
/* A little more than the tail: the words start on the moss. */
.${OVERLAP_CLASS} { position: relative; z-index: 10; margin-top: -${TAIL.wide + 110}px; }
@media (orientation: portrait) { .${OVERLAP_CLASS} { margin-top: -${TAIL.tall + 40}px; } }

.rsl-tint {
  background:
    radial-gradient(46% 30% at 50% 17%, rgba(6, 12, 7, 0.5) 0%, rgba(6, 12, 7, 0.18) 65%, transparent 100%),
    linear-gradient(180deg, rgba(8, 14, 9, 0.62) 0%, rgba(8, 14, 9, 0.18) 34%, rgba(8, 14, 9, 0) 52%, rgba(8, 14, 9, 0.16) 100%);
}
.rsl-tint.is-portrait {
  background: linear-gradient(180deg, rgba(8, 14, 9, 0.72) 0%, rgba(8, 14, 9, 0.42) 34%, rgba(8, 14, 9, 0.06) 56%, rgba(8, 14, 9, 0.12) 100%);
}
.rsl-light {
  background:
    radial-gradient(60% 55% at 12% 6%, rgba(255, 196, 120, 0.12), transparent 70%),
    radial-gradient(120% 70% at 50% 120%, rgba(4, 10, 4, 0.35), transparent 60%);
  mix-blend-mode: soft-light;
}
/* The log's lower edge fades into the forest floor under the choices. */
.rsl-log { -webkit-mask-image: linear-gradient(to bottom, #000 62%, transparent 100%); mask-image: linear-gradient(to bottom, #000 62%, transparent 100%); }
.rsl-copy { text-shadow: 0 1px 14px rgba(0, 0, 0, 0.65), 0 0 2px rgba(0, 0, 0, 0.35); }
.rsl-whisk { filter: drop-shadow(0 14px 18px rgba(6, 14, 6, 0.35)) saturate(0.95); }
.rsl-dipper { filter: drop-shadow(0 22px 22px rgba(10, 8, 2, 0.32)); }
.rsl-foliage {
  filter: brightness(0.9) saturate(0.95);
  -webkit-mask-image: linear-gradient(to bottom, #000 78%, transparent 100%); mask-image: linear-gradient(to bottom, #000 78%, transparent 100%);
}
`;

export default RitualStillLifeHero;
