import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import GlassTitle from '../glass/GlassTitle';
import { GLASS_FONT } from '../glass/glassFont';

// A bridge between two sections as one layered scene, back to front: a
// forest pond, a dark veil, a heading in the hero's glass lettering, one
// cut-out foreground (moved as one), and a fade into the section below.
//
// Two scenes share it (the `scene` prop):
//   rental  the homepage, into sauna rental: the rental forest pond and both
//           saunas, anchored to the foot of the stage, their roofs over the
//           lower part of "Pirts Noma". The heading is the rental section's
//           own title, split at its bracket: "Pirts Noma" / "Ar vai Bez Zāļu
//           Kubla"; that section keeps the real <h2>.
//   rentalHero  the Pirts Noma page's hero: the rental scene opening the
//           page (see Scene.hero), under the page's own "Pirts Noma".
//   tub     the rituals page, between the ritual's steps and its prices: the
//           birch pond and the herbal tub with the guests and the host
//           pouring, under "Zāļu kubla baudīšana" set in two lines.
//
// Desktop: a 200svh section with a sticky full-height stage on a single
// scroll timeline (framer-motion, no React render per scroll step). The
// forest comes in out of the black, the title rises a little faster than the
// forest, the foreground rises faster still and settles from 0.98 towards
// 1.02, then keeps rising as the stage hands over to the next section.
//
// Phones and upright tablets: no pinning, the title above the foreground, a
// small parallax, laid out per scene. Reduced motion: the held composition
// in normal flow. The lettering is decoration (aria-hidden).

const MEDIA = '/media/interlude';
const COMPACT = '(max-width: 767px), (orientation: portrait) and (max-width: 1024px)';
const HEADER = 68;
// Line pitch of a two-line title, in em: room for the comma under "ļ" above
// the second line's ascenders.
const LINE_GAP = 1.02;

type Mode = 'stage' | 'compact';
const pickMode = (): Mode => (window.matchMedia(COMPACT).matches ? 'compact' : 'stage');

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Picture {
  w: number;
  h: number;
  src: string;
  small: string;
  smallW: number;
}

// An image covering a box, centred (or around a focus point, 0–1).
const cover = (box: Box, iw: number, ih: number, fx = 0.5, fy = 0.5): Box => {
  const s = Math.max(box.w / iw, box.h / ih);
  const w = iw * s;
  const h = ih * s;
  return { x: box.x + (box.w - w) * fx, y: box.y + (box.h - h) * fy, w, h };
};

interface Layout {
  W: number;
  H: number;
  forest: Box;
  fg: Box;
  // The foreground's cut left end shows inside the stage: fade it.
  fadeLeft: boolean;
  // `baseline` is the last line's.
  title: { left: number; right: number; baseline: number; maxSize: number };
}

interface Scene {
  forest: Picture;
  fg: Picture;
  fgOrigin: string;
  // Extra class on the foreground picture, and on the veil.
  fgClass?: string;
  veilClass?: string;
  title: (t: (key: string) => string) => { lines: string[]; sub: string };
  alt: (t: (key: string) => string) => string;
  ns: string;
  stage: (W: number, H: number) => Layout;
  // W: the stage's width; VH: the window's height.
  compact: (W: number, VH: number) => Layout & { stageH: number };
  // The page's opening scene instead of a bridge: in place at the top from
  // the start (no rise out of the black), an entrance on arrival, a scroll
  // cue, the heading as the page's <h1>, the pictures loaded at once.
  hero?: boolean;
  // On phones, the one-line title set in two lines, larger.
  splitOnPhones?: boolean;
  // Share of the stage the fade into the next section covers.
  foot: number;
  // On phones, how far the foreground lifts as the section leaves (px).
  compactLift: number;
}

// ------------------------------------------------------------- rental

const RENTAL_FOREST: Picture = { w: 1672, h: 941, src: `${MEDIA}/forest-1672.webp`, small: `${MEDIA}/forest-960.webp`, smallW: 960 };
const SAUNAS: Picture = { w: 1536, h: 1024, src: `${MEDIA}/saunas-1536.webp`, small: `${MEDIA}/saunas-960.webp`, smallW: 960 };
// Points in the saunas picture, as shares of its size (measured on its alpha).
const SAUNA = {
  peakTop: 0.055, // the log sauna's ridge, the highest point
  peakLeft: 0.17,
  // The stage's foot crosses the picture here: the log sauna's base (0.78)
  // sits just above it inside the fade, the front sauna's (0.95) below it,
  // low enough that the final lift never brings it into view.
  footAt: 0.84,
};
// The title's foot dips this far (in em) behind the log sauna's ridge.
const ROOF_OVERLAP = 0.2;

const rentalStage = (W: number, H: number): Layout => {
  const forest = cover({ x: -0.04 * W, y: -0.1 * H, w: 1.08 * W, h: 1.2 * H }, RENTAL_FOREST.w, RENTAL_FOREST.h);
  // Both saunas, as one picture, standing on the foot of the stage and a
  // little right of centre; never so tall that the ridge meets the title's
  // room under the navigation.
  const fgH = Math.min(0.8 * H, ((0.86 * W) * SAUNAS.h) / SAUNAS.w);
  const fgW = (fgH * SAUNAS.w) / SAUNAS.h;
  const fg = { x: (W - fgW) / 2 + 0.03 * W, y: H - SAUNA.footAt * fgH, w: fgW, h: fgH };
  const peak = fg.y + SAUNA.peakTop * fgH;

  const left = 0.06 * W;
  const right = 0.94 * W;
  // The title's top (0.74 em above the baseline) leaves room for the
  // subtitle above it, under the navigation.
  const room = HEADER + 0.06 * H + 48;
  const estimate = Math.min(0.34 * H, (right - left) / 3.9, (peak - room) / (0.74 - ROOF_OVERLAP));
  const baseline = peak + ROOF_OVERLAP * estimate;
  return { W, H, forest, fg, fadeLeft: false, title: { left, right, baseline, maxSize: estimate } };
};

const rentalCompact = (W: number): Layout & { stageH: number } => {
  const left = 0.06 * W;
  const right = 0.94 * W;
  const size = Math.min((right - left) / 3.9, 150);
  const baseline = 64 + 52 + size * 0.74;
  // As wide as the screen, so both roofs and the chimney stay whole.
  const fgW = 1.02 * W;
  const fgH = (fgW * SAUNAS.h) / SAUNAS.w;
  const fgTop = baseline - ROOF_OVERLAP * size - SAUNA.peakTop * fgH;
  const stageH = fgTop + SAUNA.footAt * fgH;
  const forest = cover({ x: -0.05 * W, y: -0.06 * stageH, w: 1.1 * W, h: 1.12 * stageH }, RENTAL_FOREST.w, RENTAL_FOREST.h);
  return {
    W,
    H: stageH,
    stageH,
    forest,
    fg: { x: (W - fgW) / 2, y: fgTop, w: fgW, h: fgH },
    fadeLeft: false,
    title: { left, right, baseline, maxSize: size },
  };
};

// The Pirts Noma page's hero on phones: nearly the whole screen, the
// heading near the top, both saunas standing on the foot, a little wider than
// the screen so they read larger (the outer eaves only just cut).
const rentalHeroCompact = (W: number, VH: number): Layout & { stageH: number } => {
  const stageH = Math.max(540, 0.9 * VH);
  const left = 0.08 * W;
  const right = 0.92 * W;
  // Two lines, "Pirts" / "Noma" (about 2.2 em wide each).
  const size = Math.min((right - left) / 2.25, 0.2 * stageH);
  const subSize = Math.max(18, W * 0.055);
  const baseline = HEADER + 0.05 * stageH + subSize * 1.6 + size * (0.74 + LINE_GAP);
  // A little wider than the screen and nudged right: the log sauna's ridge
  // and the front sauna's chimney stay in view, only the outer eaves go.
  const fgW = 1.24 * W;
  const fgH = (fgW * SAUNAS.h) / SAUNAS.w;
  const fgTop = stageH - SAUNA.footAt * fgH;
  const forest = cover({ x: -0.05 * W, y: -0.04 * stageH, w: 1.1 * W, h: 1.08 * stageH }, RENTAL_FOREST.w, RENTAL_FOREST.h, 0.55, 0.5);
  return {
    W,
    H: stageH,
    stageH,
    forest,
    fg: { x: (W - fgW) / 2 + 0.06 * W, y: fgTop, w: fgW, h: fgH },
    fadeLeft: false,
    title: { left, right, baseline, maxSize: size },
  };
};

// ------------------------------------------------------------- tub

const BIRCH_POND: Picture = { w: 1672, h: 941, src: `${MEDIA}/pond-birches-1672.webp`, small: `${MEDIA}/pond-birches-960.webp`, smallW: 960 };
const TUB: Picture = { w: 1536, h: 1024, src: `${MEDIA}/tub-1536.webp`, small: `${MEDIA}/tub-960.webp`, smallW: 960 };
// Points in the tub picture, as shares of its size.
const SPOT = {
  hostHeadTop: 0.03,
  hostHeadLeft: 0.79,
  guestHeadsTop: 0.44,
  facesBottom: 0.7,
};
// Width of "Zāļu kubla" (the longer line) per em, in the glass face.
const TUB_LINE_EM = 4.1;

const tubStage = (W: number, H: number): Layout => {
  // The birch pond seen from the water's edge: cropped from the left, so the
  // birch trunks and the bright water stand behind the title and the tub.
  const forest = cover({ x: -0.04 * W, y: -0.1 * H, w: 1.08 * W, h: 1.2 * H }, BIRCH_POND.w, BIRCH_POND.h, 0.3, 0.55);
  // The tub as wide as the stage and a little more, so its cut left end
  // stays outside; narrower only where that would push the faces too low.
  // The host's head stays clear of the navigation even after the final lift.
  const headRoom = HEADER + 84;
  const facesShare = SPOT.facesBottom - SPOT.hostHeadTop;
  const maxH = (0.95 * H - headRoom) / facesShare;
  const tubW = Math.min(1.04 * W, (maxH * TUB.w) / TUB.h);
  const tubH = (tubW * TUB.h) / TUB.w;
  // Its bottom always well below the stage, so the cut never shows.
  const tubTop = Math.max(headRoom - SPOT.hostHeadTop * tubH, H + 90 - tubH);
  const fg = { x: W - tubW, y: tubTop, w: tubW, h: tubH };
  const fadeLeft = fg.x + 0.02 * tubW > 0;

  // Two lines in the forest between the left edge and the host, the lower
  // one's foot behind the guests' heads and the pitcher.
  const left = Math.max(0.05 * W, fg.x + 0.04 * tubW);
  const right = fg.x + SPOT.hostHeadLeft * tubW + 0.012 * W;
  const headsTop = fg.y + SPOT.guestHeadsTop * tubH;
  const estimate = Math.min(0.3 * H, (right - left) / TUB_LINE_EM);
  const baseline = headsTop + 0.17 * estimate;
  const maxSize = Math.min(0.3 * H, (baseline - HEADER - 40) / (0.74 + LINE_GAP));
  return { W, H, forest, fg, fadeLeft, title: { left, right, baseline, maxSize } };
};

const tubCompact = (W: number): Layout & { stageH: number } => {
  const left = 0.06 * W;
  const right = 0.94 * W;
  const size = Math.min((right - left) / TUB_LINE_EM, 120);
  const baseline = 64 + size * (0.74 + LINE_GAP);
  const tubW = 1.08 * W;
  const tubH = (tubW * TUB.h) / TUB.w;
  // The people and the pouring below the title; the tub's lowest part stays out of view.
  const tubTop = baseline + size * 0.08 - SPOT.hostHeadTop * tubH;
  const stageH = tubTop + tubH * 0.92;
  const forest = cover({ x: -0.05 * W, y: -0.06 * stageH, w: 1.1 * W, h: 1.12 * stageH }, BIRCH_POND.w, BIRCH_POND.h, 0.42, 0.5);
  return {
    W,
    H: stageH,
    stageH,
    forest,
    fg: { x: W - tubW, y: tubTop, w: tubW, h: tubH },
    fadeLeft: false,
    title: { left, right, baseline, maxSize: size },
  };
};

// Splits "Zāļu kubla baudīšana" before its last word.
const twoLines = (text: string) => {
  const at = text.lastIndexOf(' ');
  return at > 0 ? [text.slice(0, at), text.slice(at + 1)] : [text];
};

const SCENES: Record<'rental' | 'rentalHero' | 'tub', Scene> = {
  rental: {
    forest: RENTAL_FOREST,
    fg: SAUNAS,
    fgOrigin: '50% 100%',
    fgClass: 'ti-fg-ground',
    ns: 'rental',
    title: (t) => {
      const m = t('title').match(/^(.*?)\s*\((.*)\)\s*$/);
      return m ? { lines: [m[1]], sub: m[2] } : { lines: [t('title')], sub: '' };
    },
    alt: (t) => t('interlude.alt'),
    stage: rentalStage,
    compact: rentalCompact,
    foot: 0.2,
    // Stands on the stage's foot: it settles, never lifts off it.
    compactLift: 0,
  },
  // The Pirts Noma page's hero: the homepage's rental scene, opening the page.
  rentalHero: {
    forest: RENTAL_FOREST,
    fg: SAUNAS,
    fgOrigin: '50% 100%',
    fgClass: 'ti-fg-ground',
    veilClass: 'ti-veil-hero',
    ns: 'noma',
    title: (t) => ({ lines: [t('hero.title')], sub: t('hero.subtitle') }),
    alt: (t) => t('page.heroAlt'),
    stage: rentalStage,
    compact: rentalHeroCompact,
    foot: 0.2,
    compactLift: 0,
    hero: true,
    splitOnPhones: true,
  },
  tub: {
    forest: BIRCH_POND,
    fg: TUB,
    fgOrigin: '100% 100%',
    veilClass: 'ti-veil-left',
    ns: 'rituali',
    title: (t) => ({ lines: twoLines(t('tubScene.title')), sub: '' }),
    alt: (t) => t('tubScene.alt'),
    stage: tubStage,
    compact: tubCompact,
    foot: 0.1,
    compactLift: -24,
  },
};

// The stage's size, measured (React renders only when it changes).
const useStageSize = (ref: React.RefObject<HTMLElement>) => {
  const [size, setSize] = useState({ W: 0, H: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const W = el.clientWidth;
      const H = el.clientHeight;
      setSize((s) => (s.W === W && s.H === H ? s : { W, H }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
};

interface Motion {
  forestY?: MotionValue<number>;
  titleY?: MotionValue<number>;
  titleOpacity?: MotionValue<number>;
  glassShift?: MotionValue<number>;
  fgY?: MotionValue<number>;
  fgScale?: MotionValue<number>;
}

const SceneLayers: React.FC<{ scene: Scene; layout: Layout; motion?: Motion; compact?: boolean }> = ({
  scene,
  layout,
  motion: m = {},
  compact,
}) => {
  const { t } = useTranslation(scene.ns);
  const titled = scene.title(t);
  const lines = compact && scene.splitOnPhones && titled.lines.length === 1 ? twoLines(titled.lines[0]) : titled.lines;
  const sub = titled.sub;
  // Each line's measured size; the lines share the smallest, so they match.
  const [sizes, setSizes] = useState<number[]>([]);
  const [titleBox, setTitleBox] = useState<{ x: number; top: number; size: number } | null>(null);
  const onLayout = useCallback((i: number, box: { x: number; top: number; size: number }) => {
    setSizes((prev) => (prev[i] === box.size ? prev : Object.assign([...prev], { [i]: box.size })));
    if (i === 0) setTitleBox((prev) => (prev && prev.x === box.x && prev.top === box.top && prev.size === box.size ? prev : box));
  }, []);
  const layouts = useRef<((box: { x: number; top: number; size: number }) => void)[]>([]);
  lines.forEach((_, i) => {
    layouts.current[i] ??= (box) => onLayout(i, box);
  });

  const { W, H, forest, fg, title } = layout;
  if (!W || !H) return null;
  const measured = sizes.slice(0, lines.length).filter((s) => s > 0);
  const lineSize = measured.length === lines.length ? Math.min(title.maxSize, ...measured) : title.maxSize;
  const subSize = compact ? Math.max(18, W * 0.055) : Math.max(20, Math.min(40, W * 0.022));
  const { forest: bg, fg: pic } = scene;
  const hero = scene.hero;
  const loading = hero ? 'eager' : 'lazy';

  return (
    <>
      {hero && (
        <h1 className="sr-only">
          {lines.join(' ')}
          {sub ? ` – ${sub}` : ''}
        </h1>
      )}
      {/* 1. The forest pond, darkened to the site's evening. */}
      <motion.div aria-hidden="true" className="absolute inset-0 will-change-transform" style={{ y: m.forestY }}>
        <img
          src={bg.src}
          srcSet={`${bg.small} ${bg.smallW}w, ${bg.src} ${bg.w}w`}
          sizes="100vw"
          alt=""
          loading={loading}
          decoding="async"
          draggable={false}
          className={`ti-forest absolute max-w-none select-none ${hero ? 'ti-in-forest' : ''}`}
          style={{ left: forest.x, top: forest.y, width: forest.w, height: forest.h }}
        />
      </motion.div>
      {/* 2. The veil, with the soft boundary out of the section above. */}
      <div aria-hidden="true" className={`ti-veil pointer-events-none absolute inset-0 ${scene.veilClass ?? ''}`} />

      {/* 3. The heading in the hero's glass. */}
      <motion.div aria-hidden="true" className="absolute inset-0 will-change-transform" style={{ y: m.titleY, opacity: m.titleOpacity }}>
        <div className={`absolute inset-0 ${hero ? 'ti-in-title' : ''}`}>
        {lines.map((line, i) => (
          <GlassTitle
            key={i}
            text={line}
            width={W}
            height={H}
            left={title.left}
            right={title.right}
            baseline={title.baseline - (lines.length - 1 - i) * lineSize * LINE_GAP}
            maxSize={lineSize}
            align={lines.length > 1 && !hero ? 'start' : 'center'}
            glass={{ src: bg.small, ...forest }}
            glassStyle={m.glassShift ? { y: m.glassShift } : undefined}
            onLayout={layouts.current[i]}
          />
        ))}
        {sub && titleBox && (
          <p
            className="ti-sub hero-glass-text absolute font-extrabold"
            style={{
              // Centred over the phone hero's stacked title; else on its left edge.
              ...(hero && compact ? { left: W / 2, transform: 'translateX(-50%)' } : { left: titleBox.x + titleBox.size * 0.03 }),
              top: titleBox.top - subSize * 1.5,
              fontSize: subSize,
              fontFamily: GLASS_FONT,
              ['--glass-src' as string]: `url(${bg.small})`,
            }}
          >
            {sub}
          </p>
        )}
        </div>
      </motion.div>

      {/* 4. The foreground: one cut-out, moved as one. */}
      <motion.div
        className="absolute will-change-transform"
        style={{
          left: fg.x,
          top: fg.y,
          width: fg.w,
          height: fg.h,
          y: m.fgY,
          scale: m.fgScale,
          transformOrigin: scene.fgOrigin,
        }}
      >
        <img
          src={pic.src}
          srcSet={`${pic.small} ${pic.smallW}w, ${pic.src} ${pic.w}w`}
          sizes={`${Math.round((fg.w / W) * 100)}vw`}
          width={pic.w}
          height={pic.h}
          alt={scene.alt(t)}
          loading={loading}
          decoding="async"
          draggable={false}
          className={`ti-fg block h-full w-full select-none ${scene.fgClass ?? ''} ${layout.fadeLeft ? 'ti-fg-fade' : ''} ${hero ? 'ti-in-fg' : ''}`}
        />
      </motion.div>

      {/* 5. Into the next section's black. */}
      <div aria-hidden="true" className="ti-foot pointer-events-none absolute inset-x-0 bottom-0" style={{ height: `${scene.foot * 100}%` }} />
    </>
  );
};

// ------------------------------------------------------------- desktop

// The hero's "scroll on" cue, gone once the page moves.
const ScrollCue: React.FC<{ progress: MotionValue<number>; label: string; onClick: () => void }> = ({ progress, label, onClick }) => {
  const opacity = useTransform(progress, [0, 0.06], [1, 0]);
  const visibility = useTransform(progress, (v) => (v > 0.06 ? 'hidden' : 'visible'));
  return (
    <motion.button type="button" onClick={onClick} className="ti-cue absolute inset-x-0 bottom-0 z-10 mx-auto" style={{ opacity, visibility }}>
      <span className="ti-cue-label">{label}</span>
      <ChevronDown aria-hidden="true" className="ti-cue-arrow h-6 w-6" strokeWidth={1.5} />
    </motion.button>
  );
};

const ScrollStage: React.FC<{ scene: Scene }> = ({ scene }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const { W, H } = useStageSize(stageRef);
  const { t } = useTranslation(scene.ns);
  // A bridge: 0 is the section's top at the bottom of the window, 0.5 it
  // reaches the top and the stage holds, 1 the stage lets go.
  // The hero: 0 is the top of the page, 1 the stage lets go.
  const { scrollYProgress: p } = useScroll({
    target: sectionRef,
    offset: scene.hero ? ['start start', 'end end'] : ['start end', 'end end'],
  });

  const bridge = !scene.hero;
  const forestY = useTransform(p, [0, 1], bridge ? [60, -40] : [0, -50]);
  const titleY = useTransform(p, bridge ? [0.3, 0.7, 1] : [0, 0.6, 1], bridge ? [90, 0, -60] : [0, -24, -70]);
  const titleOpacity = useTransform(p, bridge ? [0.3, 0.62] : [0, 1], bridge ? [0, 1] : [1, 1]);
  // In the hero the saunas start low and rise over the foot of the title.
  const fgY = useTransform(p, bridge ? [0, 0.35, 0.7, 1] : [0, 0.6, 1], bridge ? [110, 90, 0, -70] : [150, 0, -40]);
  const fgScale = useTransform(p, bridge ? [0.35, 0.7, 1] : [0, 0.6, 1], bridge ? [0.98, 1, 1.02] : [0.96, 1, 1.02]);
  // Keeps the forest inside the letters lined up with the forest behind them.
  const glassShift = useTransform(() => forestY.get() - titleY.get());

  // The cue: on into the scene, far enough for the saunas to stand in place.
  const advance = () => {
    const section = sectionRef.current;
    if (!section) return;
    const travel = section.offsetHeight - window.innerHeight;
    window.scrollTo({ top: section.offsetTop + travel * 0.62, behavior: 'smooth' });
  };

  return (
    <section ref={sectionRef} className={`ti relative bg-black ${scene.hero ? 'ti-hero' : 'ti-scroll'}`}>
      <style>{CSS}</style>
      <div ref={stageRef} className="ti-stage sticky top-0 overflow-hidden">
        <SceneLayers scene={scene} layout={scene.stage(W, H)} motion={{ forestY, titleY, titleOpacity, glassShift, fgY, fgScale }} />
        {scene.hero && <ScrollCue progress={p} label={t('page.heroScroll')} onClick={advance} />}
      </div>
    </section>
  );
};

const StaticStage: React.FC<{ scene: Scene }> = ({ scene }) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const { W, H } = useStageSize(stageRef);
  return (
    <section className="ti relative bg-black">
      <style>{CSS}</style>
      <div ref={stageRef} className="ti-stage relative overflow-hidden">
        <SceneLayers scene={scene} layout={scene.stage(W, H)} />
      </div>
    </section>
  );
};

// ------------------------------------------------------------- compact

const CompactStage: React.FC<{ scene: Scene; reduced: boolean }> = ({ scene, reduced }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const { W } = useStageSize(sectionRef);
  // The window's height when the layout was first made: phones change it
  // as their address bar shows and hides, which must not move the scene.
  const [vh] = useState(() => window.innerHeight);
  const layout = scene.compact(W, vh);
  const { scrollYProgress: p } = useScroll({
    target: sectionRef,
    offset: scene.hero ? ['start start', 'end start'] : ['start end', 'end start'],
  });
  // The hero scrolls away: the forest a little slower than the page, the
  // title slower still, the saunas with it.
  const still = [0, 0, 0];
  const forestY = useTransform(p, [0, 1], reduced ? [0, 0] : scene.hero ? [0, 70] : [24, -24]);
  const titleY = useTransform(p, [0, 0.5, 1], reduced ? still : scene.hero ? [0, 30, 60] : [36, 0, -16]);
  const fgY = useTransform(p, [0, 0.5, 1], reduced ? still : scene.hero ? [0, 0, 0] : [48, 0, scene.compactLift]);
  const glassShift = useTransform(() => forestY.get() - titleY.get());
  return (
    <section ref={sectionRef} className="ti relative overflow-hidden bg-black" style={{ height: layout.stageH || '120vw' }}>
      <style>{CSS}</style>
      <SceneLayers scene={scene} layout={layout} motion={{ forestY, titleY, glassShift, fgY }} compact />
    </section>
  );
};

const TubInterlude: React.FC<{ scene: keyof typeof SCENES }> = ({ scene: name }) => {
  const scene = SCENES[name];
  const reduced = useReducedMotion() ?? false;
  const [mode, setMode] = useState<Mode>(pickMode);
  useEffect(() => {
    const query = window.matchMedia(COMPACT);
    const onChange = () => setMode(pickMode());
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  if (mode === 'compact') return <CompactStage scene={scene} reduced={reduced} />;
  return reduced ? <StaticStage scene={scene} /> : <ScrollStage scene={scene} />;
};

const CSS = `
.ti-scroll { height: 200vh; height: 200svh; }
.ti-hero { height: 180vh; height: 180svh; }
.ti-stage { height: 100vh; height: 100svh; }

.ti-forest { filter: brightness(0.6) saturate(0.92) contrast(1.04); }
.ti-veil {
  background:
    linear-gradient(180deg, #000 0%, rgba(0, 0, 0, 0.82) 7%, rgba(0, 0, 0, 0.35) 20%, rgba(0, 0, 0, 0) 36%),
    radial-gradient(120% 90% at 50% 40%, rgba(4, 12, 7, 0) 40%, rgba(2, 6, 3, 0.45) 100%),
    rgba(6, 14, 9, 0.22);
}
/* The birch pond is busy behind the title: a little deeper on the left,
   clear over the water and the guests. */
.ti-veil-left::after {
  content: ''; position: absolute; inset: 0;
  background:
    linear-gradient(180deg, #000 0%, rgba(0, 0, 0, 0.7) 12%, rgba(0, 0, 0, 0.25) 30%, rgba(0, 0, 0, 0) 46%),
    linear-gradient(90deg, rgba(3, 9, 5, 0.5) 0%, rgba(3, 9, 5, 0.3) 32%, rgba(3, 9, 5, 0) 58%);
}
/* The hero opens the page: no black to rise out of, only enough shade at
   the top for the navigation when it slides in. */
.ti-veil-hero {
  background:
    linear-gradient(180deg, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0.2) 14%, rgba(0, 0, 0, 0) 30%),
    radial-gradient(120% 90% at 50% 40%, rgba(4, 12, 7, 0) 40%, rgba(2, 6, 3, 0.45) 100%),
    rgba(6, 14, 9, 0.22);
}
/* The hero's arrival, once: the forest settles, the title rises out of a
   soft blur, then the saunas come up. */
.ti-in-forest { animation: ti-in-forest 1600ms cubic-bezier(0.22, 1, 0.36, 1) both; }
.ti-in-title { animation: ti-in-title 1100ms cubic-bezier(0.22, 1, 0.36, 1) 250ms both; }
.ti-in-fg { animation: ti-in-fg 1200ms cubic-bezier(0.22, 1, 0.36, 1) 550ms both; }
@keyframes ti-in-forest { from { opacity: 0; transform: scale(1.06); } to { opacity: 1; transform: none; } }
@keyframes ti-in-title { from { opacity: 0; transform: translateY(28px); filter: blur(10px); } to { opacity: 1; transform: none; filter: none; } }
@keyframes ti-in-fg { from { opacity: 0; transform: translateY(60px); } to { opacity: 1; transform: none; } }
.ti-cue {
  display: flex; flex-direction: column; align-items: center; gap: 0.35rem;
  width: max-content; margin-bottom: clamp(1.25rem, 4vh, 2.5rem);
  padding: 0.5rem 0.9rem; border-radius: 999px;
  color: rgba(244, 239, 228, 0.86);
  font-size: 0.78rem; letter-spacing: 0.18em; text-transform: uppercase;
  animation: ti-in-title 900ms ease 1300ms both;
}
.ti-cue:hover { color: #fffdf7; }
.ti-cue:focus-visible { outline: 2px solid rgba(190, 228, 200, 0.85); outline-offset: 2px; }
.ti-cue-label { text-shadow: 0 1px 10px rgba(0, 0, 0, 0.55); }
.ti-cue-arrow { color: rgba(196, 228, 204, 0.9); animation: ti-bob 2.4s cubic-bezier(0.45, 0, 0.55, 1) infinite; }
@keyframes ti-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(5px); } }
@media (prefers-reduced-motion: reduce) {
  .ti-in-forest, .ti-in-title, .ti-in-fg, .ti-cue { animation: none; }
  .ti-cue-arrow { animation: none; }
}
/* The daylight photos, brought to the forest's exposure. */
.ti-fg { filter: brightness(0.9) saturate(0.94) contrast(1.03); }
.ti-fg-fade {
  -webkit-mask-image: linear-gradient(to right, transparent 0, #000 7%);
  mask-image: linear-gradient(to right, transparent 0, #000 7%);
}
/* The saunas' foundations (the log sauna's at 0.78 of the picture, the
   front one's at 0.95) melt into the ground; the roofs stay whole. */
.ti-fg-ground {
  -webkit-mask-image: linear-gradient(180deg, #000 0%, #000 70%, rgba(0, 0, 0, 0.55) 78%, rgba(0, 0, 0, 0) 90%);
  mask-image: linear-gradient(180deg, #000 0%, #000 70%, rgba(0, 0, 0, 0.55) 78%, rgba(0, 0, 0, 0) 90%);
}
.ti-foot { background: linear-gradient(0deg, #000 0%, rgba(0, 0, 0, 0.75) 35%, rgba(0, 0, 0, 0) 100%); }
.ti-sub { margin: 0; letter-spacing: 0.04em; line-height: 1; white-space: nowrap; }
`;

export default TubInterlude;
