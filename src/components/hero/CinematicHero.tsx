import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { useMotionValue } from 'framer-motion';
import GlassTitle from '../glass/GlassTitle';
import { FrameSequence } from './frameSequence';
import { desktopSequence, mobileSequence, sourceFrameAt, HOLD_START, PLAY_END, type HeroSequence } from './heroSequence';

// The rituals page hero: hands preparing a pirts treatment, played by scrolling.
//
// A tall section with a sticky full-screen stage under the navigation. The
// first tenth of its scroll holds the opening frame while the title settles,
// the next three quarters advance through the footage (more scroll for the
// hands lifting and the treatment dripping back, see heroSequence.ts), the
// last part holds the final frame and the page carries on. It is ordinary
// page scrolling read from the section's position: nothing listens to the
// wheel. Frames are drawn on a canvas from a WebP sequence, in
// requestAnimationFrame, with styles written straight onto the elements;
// React does not re-render while scrolling. The footage follows the scroll
// with inertia: when the visitor stops, it plays on and eases to a halt
// instead of stopping dead. Between two frames of the sequence the canvas
// shows both, the next one faded in by how far along it is, so even a slow
// glide moves without steps.
//
// The title is the homepage's glass lettering, big and centred, with the
// opening frame seen through the letters. On desktop the stage fills the
// whole screen; the navigation slides in over it once the page scrolls.
//
// Portrait phones and tablets get a lighter portrait sequence and a shorter
// section. Reduced motion, Save-Data and very small devices get the poster
// and the title without scrubbing.

const PORTRAIT = '(orientation: portrait) and (max-width: 1024px)';
// Where the navigation hides at the top (HeaderSection), the stage starts at 0.
const BAR_HIDES = '(min-width: 1024px)';
const REDUCED = '(prefers-reduced-motion: reduce)';
const DPR_CAP = 2;
// Decoded before the loading indicator goes.
const ESSENTIAL = 8;
// Give up waiting for the opening (poster, font) or the first frames after this.
const REVEAL_TIMEOUT = 1500;
const LOAD_TIMEOUT = 12000;
// The footage follows the scroll on a critically damped spring: it picks up
// speed softly, runs on after the scrolling stops and settles on the scroll's
// frame without overshooting. Higher is tighter; at 3.2 it trails the scroll
// by about half a second and glides on, slowing all the while, for some two
// seconds after the scroll stops.
const FOLLOW_RATE = 3.2;

type Mode = 'desktop' | 'mobile' | 'still';

const lowEndDevice = () => {
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean };
    deviceMemory?: number;
  };
  return Boolean(
    nav.connection?.saveData ||
      (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) ||
      (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency <= 2)
  );
};

const pickMode = (): Mode => {
  if (window.matchMedia(REDUCED).matches || lowEndDevice()) return 'still';
  return window.matchMedia(PORTRAIT).matches ? 'mobile' : 'desktop';
};

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (t: number) => t * t * (3 - 2 * t);
// 0 before `from`, 1 after `to`, eased between.
const ramp = (p: number, from: number, to: number) => smooth(clamp01((p - from) / (to - from)));

const CinematicHero: React.FC = () => {
  const { t } = useTranslation('hero');
  const [mode, setMode] = useState<Mode>(pickMode);
  const [posterReady, setPosterReady] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);
  const headerHRef = useRef(68);
  const [stage, setStage] = useState({ W: 0, H: 0 });
  const [titleSize, setTitleSize] = useState(0);
  // Keeps the picture inside the letters still while the title drifts.
  const glassShift = useMotionValue(0);
  const onTitleLayout = useCallback((box: { size: number }) => setTitleSize(box.size), []);

  useEffect(() => {
    const queries = [window.matchMedia(PORTRAIT), window.matchMedia(REDUCED)];
    const onChange = () => setMode(pickMode());
    queries.forEach((q) => q.addEventListener('change', onChange));
    return () => queries.forEach((q) => q.removeEventListener('change', onChange));
  }, []);

  // The stage starts under the fixed navigation, whatever its height.
  useEffect(() => {
    const header = document.querySelector('header');
    const section = sectionRef.current;
    if (!header || !section) return;
    const hides = window.matchMedia(BAR_HIDES);
    const measure = () => {
      headerHRef.current = hides.matches ? 0 : header.getBoundingClientRect().height;
      section.style.setProperty('--ch-top', `${headerHRef.current}px`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(header);
    hides.addEventListener('change', measure);
    return () => {
      ro.disconnect();
      hides.removeEventListener('change', measure);
    };
  }, []);

  // The glass title is laid out in stage pixels.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () =>
      setStage((prev) => (prev.W === el.clientWidth && prev.H === el.clientHeight ? prev : { W: el.clientWidth, H: el.clientHeight }));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The title enters once, when the opening image (and the title's font) is
  // there, or after a short wait if either is not coming.
  useEffect(() => {
    if (revealed) return;
    let cancelled = false;
    const font = document.fonts?.load('800 1em "Saira Extra Condensed"').catch(() => undefined) ?? Promise.resolve();
    const opening = posterReady ? font : new Promise<never>(() => {});
    const reveal = () => {
      if (!cancelled) requestAnimationFrame(() => setRevealed(true));
    };
    opening.then(reveal);
    const timer = window.setTimeout(reveal, REVEAL_TIMEOUT);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [posterReady, revealed]);

  // The scrubbing.
  useEffect(() => {
    if (mode === 'still') return;
    const section = sectionRef.current!;
    const stage = stageRef.current!;
    const canvas = canvasRef.current!;
    const titleEl = titleRef.current!;
    const shadeEl = shadeRef.current!;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const seq: HeroSequence = mode === 'mobile' ? mobileSequence : desktopSequence;
    const last = seq.frameCount - 1;

    let raf = 0;
    let visible = true;
    let W = 0;
    let H = 0;
    let dpr = 1;
    // The frame on the canvas (the lower of a cross-faded pair), and what the
    // last draw was.
    let shown = -1;
    let lastKey = '';
    // The progress shown, and its speed (progress per second): follows the
    // scroll's progress with inertia.
    let shownP = -1;
    let shownV = 0;
    let lastTime = 0;
    const reduced = window.matchMedia(REDUCED).matches;
    let lastTitle = '';
    let lastShade = '';
    let scrolled = false;

    setLoading(true);
    const essential = new Set<number>();
    let essentialDone = false;
    const doneLoading = () => {
      if (essentialDone) return;
      essentialDone = true;
      setLoading(false);
    };
    const loadTimer = window.setTimeout(doneLoading, LOAD_TIMEOUT);

    const frames = new FrameSequence({
      urls: Array.from({ length: seq.frameCount }, (_, i) => seq.frameUrl(i)),
      concurrency: 4,
      keepDecoded: 24,
      onReady: (i) => {
        if (i < ESSENTIAL) {
          essential.add(i);
          if (essential.size >= ESSENTIAL) doneLoading();
        }
        schedule();
      },
    });
    frames.load(ESSENTIAL);
    for (let i = 0; i < ESSENTIAL; i++) frames.get(i);

    const progress = () => {
      const rect = section.getBoundingClientRect();
      const travel = rect.height - H;
      return travel > 0 ? clamp01((headerHRef.current - rect.top) / travel) : 0;
    };

    const targetFrame = (p: number) => {
      const play = clamp01((p - HOLD_START) / (PLAY_END - HOLD_START));
      return Math.min(last, sourceFrameAt(play) / seq.sourceStep);
    };

    const draw = (bmp: ImageBitmap, alpha = 1) => {
      // Cover the canvas, cropping around the focus point; the poster under
      // it uses the same object-position, so the two line up exactly.
      const s = Math.max(W / bmp.width, H / bmp.height);
      const dw = bmp.width * s;
      const dh = bmp.height * s;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingQuality = 'high';
      ctx.globalAlpha = alpha;
      ctx.drawImage(bmp, (W - dw) * seq.focusX, (H - dh) * seq.focusY, dw, dh);
      ctx.globalAlpha = 1;
    };

    const render = (now = performance.now()) => {
      raf = 0;
      if (!visible || !W) {
        lastTime = 0;
        return;
      }
      const scrollP = progress();
      // Spring towards where the scroll is, by elapsed time, in small steps
      // so a slow frame cannot make it jump.
      const dt = (lastTime ? Math.min(64, now - lastTime) : 16) / 1000;
      if (shownP < 0 || reduced) {
        shownP = scrollP;
        shownV = 0;
      } else {
        const w = FOLLOW_RATE;
        for (let left = dt; left > 0; left -= 0.008) {
          const h = Math.min(0.008, left);
          shownV += (w * w * (scrollP - shownP) - 2 * w * shownV) * h;
          shownP += shownV * h;
        }
        if (Math.abs(scrollP - shownP) < 0.0003 && Math.abs(shownV) < 0.002) {
          shownP = scrollP;
          shownV = 0;
        }
      }
      const p = shownP;

      // The title drifts a little, then leaves near the end.
      const exit = ramp(p, 0.78, 0.94);
      const y = -28 * smooth(clamp01(p / 0.78)) - 24 * exit;
      const title = `${y.toFixed(1)}|${exit.toFixed(3)}`;
      if (title !== lastTitle) {
        lastTitle = title;
        titleEl.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
        titleEl.style.opacity = String(1 - exit);
        glassShift.set(-y);
      }
      const shade = (0.45 * ramp(p, 0.86, 1)).toFixed(3);
      if (shade !== lastShade) {
        lastShade = shade;
        shadeEl.style.opacity = shade;
      }
      const isScrolled = scrollP > 0.015;
      if (isScrolled !== scrolled) {
        scrolled = isScrolled;
        section.dataset.scrolled = isScrolled ? 'true' : 'false';
      }

      const f = targetFrame(p);
      const index = Math.floor(f);
      const next = Math.min(last, index + 1);
      // How far towards the next frame, in 1/48ths (finer would not show).
      const blend = next > index ? Math.round((f - index) * 48) / 48 : 0;

      // The frame asked for if decoded, otherwise the last one shown.
      let bmp = frames.get(index);
      if (bmp) shown = index;
      else if (shown >= 0) bmp = frames.get(shown);
      const nextBmp = bmp && shown === index && blend > 0 ? frames.get(next) : undefined;
      for (let d = 1; d <= 4; d++) {
        if (index + d <= last) frames.get(index + d);
        if (d <= 2 && index - d >= 0) frames.get(index - d);
      }
      if (shown >= 0) frames.pin(shown);

      if (bmp) {
        const a = nextBmp ? blend : 0;
        const key = `${shown}|${a}|${canvas.width}|${canvas.height}`;
        if (key !== lastKey) {
          lastKey = key;
          draw(bmp);
          if (nextBmp) draw(nextBmp, a);
        }
      }
      if (shownP !== scrollP) {
        lastTime = now;
        schedule();
      } else lastTime = 0;
    };

    function schedule() {
      if (!raf && visible) raf = requestAnimationFrame(render);
    }

    const layout = () => {
      W = stage.clientWidth;
      H = stage.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      const cw = Math.round(W * dpr);
      const ch = Math.round(H * dpr);
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
        lastKey = '';
      }
      // Resizing clears the canvas: draw again now, before the next paint.
      cancelAnimationFrame(raf);
      raf = 0;
      render();
    };

    const onScroll = () => schedule();
    const onScreen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) schedule();
    });
    onScreen.observe(section);
    const ro = new ResizeObserver(layout);
    ro.observe(stage);
    window.addEventListener('scroll', onScroll, { passive: true });
    // Device pixel ratio changes on zoom or moving to another screen.
    const dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    dprQuery.addEventListener('change', layout);
    layout();

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(loadTimer);
      onScreen.disconnect();
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      dprQuery.removeEventListener('change', layout);
      frames.dispose();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      delete section.dataset.scrolled;
      titleEl.style.transform = '';
      titleEl.style.opacity = '';
      shadeEl.style.opacity = '';
      glassShift.set(0);
      setLoading(false);
    };
  }, [mode, glassShift]);

  // The arrow: a step into the footage, or past a still hero.
  const advance = () => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;
    const rect = section.getBoundingClientRect();
    const top = window.scrollY + rect.top - headerHRef.current;
    const travel = rect.height - stage.clientHeight;
    const behavior: ScrollBehavior = window.matchMedia(REDUCED).matches ? 'auto' : 'smooth';
    window.scrollTo({ top: mode === 'still' ? top + rect.height : top + travel * 0.32, behavior });
  };

  // The opening frame seen through the glass letters, placed exactly like
  // the poster and the canvas (cover, around the sequence's focus point).
  const portraitStage = stage.W > 0 && window.matchMedia(PORTRAIT).matches;
  const seq = portraitStage ? mobileSequence : desktopSequence;
  const posterSrc = seq.poster;
  const coverScale = Math.max(stage.W / seq.width, stage.H / seq.height);
  const posterBox = {
    w: seq.width * coverScale,
    h: seq.height * coverScale,
    x: (stage.W - seq.width * coverScale) * seq.focusX,
    y: (stage.H - seq.height * coverScale) * seq.focusY,
  };
  const maxTitle = stage.H * (portraitStage ? 0.2 : 0.34);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="hero-heading"
      data-mode={mode}
      data-revealed={revealed ? 'true' : 'false'}
      className="ch-section relative bg-[#0b100d]"
    >
      <style>{CSS}</style>
      <div ref={stageRef} className="ch-stage overflow-hidden">
        {/* The opening frame, shown at once and kept under the canvas. */}
        <picture>
          <source media={PORTRAIT} srcSet={mobileSequence.poster} />
          <img
            src={desktopSequence.poster}
            alt=""
            aria-hidden="true"
            {...{ fetchpriority: 'high' }}
            decoding="async"
            onLoad={() => setPosterReady(true)}
            onError={() => setPosterReady(true)}
            className="ch-poster absolute inset-0 h-full w-full object-cover"
          />
        </picture>
        {mode === 'still' ? (
          <span className="sr-only" role="img" aria-label={t('cinematic.alt')} />
        ) : (
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={t('cinematic.alt')}
            className="absolute inset-0 h-full w-full"
          />
        )}

        {/* Charcoal and forest green over the footage, deepest behind the title. */}
        <div aria-hidden="true" className="ch-tint pointer-events-none absolute inset-0" />
        <div ref={shadeRef} aria-hidden="true" className="pointer-events-none absolute inset-0 bg-black opacity-0" />

        {/* The heading for assistive technology; the glass letters are decoration. */}
        <h1 id="hero-heading" className="sr-only">
          {t('cinematic.title')}
        </h1>
        <div ref={titleRef} className="ch-title-motion pointer-events-none absolute inset-0 z-10">
          {stage.W > 0 && (
            <div className="ch-title-in absolute inset-0">
              <GlassTitle
                text={t('cinematic.title')}
                width={stage.W}
                height={stage.H}
                left={stage.W * (portraitStage ? 0.05 : 0.04)}
                right={stage.W * (portraitStage ? 0.95 : 0.96)}
                // Centred on the stage, a little above the middle (cap height ≈ 0.72 em).
                baseline={stage.H * (portraitStage ? 0.3 : 0.46) + (titleSize || maxTitle) * 0.36}
                maxSize={maxTitle}
                glass={{ src: posterSrc, ...posterBox }}
                glassStyle={{ y: glassShift }}
                onLayout={onTitleLayout}
              />
            </div>
          )}
        </div>

        <button type="button" onClick={advance} className="ch-cue absolute inset-x-0 bottom-0 z-10 mx-auto">
          <span className="ch-cue-label">{t('cinematic.scrollCue')}</span>
          <ChevronDown aria-hidden="true" className="ch-cue-arrow h-6 w-6" strokeWidth={1.5} />
        </button>

        <div aria-hidden="true" className={`ch-loading ${loading ? 'is-on' : ''}`} />
      </div>
    </section>
  );
};

const CSS = `
.ch-section { --ch-top: 68px; margin-top: var(--ch-top); height: 300vh; height: 300svh; }
.ch-section[data-mode='mobile'] { height: 220vh; height: 220svh; }
.ch-section[data-mode='still'] { height: auto; }
.ch-stage {
  position: sticky; top: var(--ch-top);
  height: calc(100vh - var(--ch-top)); height: calc(100svh - var(--ch-top));
}

.ch-poster { object-position: ${desktopSequence.focusX * 100}% ${desktopSequence.focusY * 100}%; }
@media ${PORTRAIT} {
  .ch-poster { object-position: ${mobileSequence.focusX * 100}% ${mobileSequence.focusY * 100}%; }
}

.ch-tint {
  background:
    radial-gradient(62% 46% at 50% 46%, rgba(9, 15, 11, 0.5) 0%, rgba(9, 15, 11, 0.22) 60%, rgba(9, 15, 11, 0) 100%),
    linear-gradient(180deg, rgba(10, 16, 12, 0.45) 0%, rgba(10, 16, 12, 0.08) 30%, rgba(10, 16, 12, 0.1) 68%, rgba(10, 10, 10, 0.72) 92%, #0a0a0a 100%),
    rgba(16, 26, 19, 0.2);
}
@media ${PORTRAIT} {
  .ch-tint {
    background:
      linear-gradient(180deg, rgba(9, 15, 11, 0.8) 0%, rgba(9, 15, 11, 0.5) 30%, rgba(9, 15, 11, 0.06) 54%, rgba(9, 15, 11, 0.12) 76%, rgba(10, 10, 10, 0.7) 93%, #0a0a0a 100%),
      rgba(16, 26, 19, 0.18);
  }
}

/* ---- title: the glass word rises in once, out of a soft blur */
.ch-title-motion { will-change: transform, opacity; }
.ch-title-in {
  opacity: 0;
  transform: translate3d(0, 26px, 0) scale(0.97);
  filter: blur(10px);
  transform-origin: 50% 46%;
}
.ch-section[data-revealed='true'] .ch-title-in {
  opacity: 1; transform: none; filter: none;
  transition:
    opacity 1000ms cubic-bezier(0.22, 0.61, 0.36, 1),
    transform 1200ms cubic-bezier(0.22, 1, 0.36, 1),
    filter 1000ms cubic-bezier(0.22, 0.61, 0.36, 1);
}

/* ---- scroll cue */
.ch-cue {
  display: flex; flex-direction: column; align-items: center; gap: 0.35rem;
  width: max-content; margin-bottom: clamp(1.25rem, 4vh, 2.5rem);
  padding: 0.5rem 0.9rem; border-radius: 999px;
  color: rgba(244, 239, 228, 0.86);
  font-size: 0.78rem; letter-spacing: 0.18em; text-transform: uppercase;
  opacity: 0;
  transition: opacity 500ms ease, visibility 0s linear 500ms, color 200ms ease;
  visibility: hidden;
}
.ch-section[data-revealed='true'] .ch-cue {
  opacity: 1; visibility: visible;
  transition: opacity 700ms ease 900ms, visibility 0s, color 200ms ease;
}
.ch-section[data-revealed='true'][data-scrolled='true'] .ch-cue {
  opacity: 0; visibility: hidden;
  transition: opacity 400ms ease, visibility 0s linear 400ms;
}
.ch-cue:hover { color: #fffdf7; }
.ch-cue:focus-visible { outline: 2px solid rgba(190, 228, 200, 0.85); outline-offset: 2px; }
.ch-cue-label { text-shadow: 0 1px 10px rgba(0, 0, 0, 0.55); }
.ch-cue-arrow { color: rgba(196, 228, 204, 0.9); animation: ch-bob 2.4s cubic-bezier(0.45, 0, 0.55, 1) infinite; }
@keyframes ch-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(5px); } }

/* ---- loading: a thin ring, only while the first frames load */
.ch-loading {
  position: absolute; right: clamp(1rem, 3vw, 2rem); bottom: clamp(1rem, 3vw, 2rem); z-index: 10;
  width: 18px; height: 18px; border-radius: 50%;
  border: 1.5px solid rgba(244, 239, 228, 0.18); border-top-color: rgba(244, 239, 228, 0.75);
  opacity: 0; transition: opacity 400ms ease;
  animation: ch-spin 0.9s linear infinite;
}
.ch-loading.is-on { opacity: 1; }
@keyframes ch-spin { to { transform: rotate(360deg); } }

@media (prefers-reduced-motion: reduce) {
  .ch-title-in, .ch-section[data-revealed='true'] .ch-title-in { transition: opacity 300ms ease; transform: none; filter: none; }
  .ch-cue-arrow, .ch-loading { animation: none; }
}
`;

export default CinematicHero;
