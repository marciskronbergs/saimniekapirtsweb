import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import GlassTitle from '../glass/GlassTitle';
import { GLASS_FONT, useGlassFont } from '../glass/glassFont';

// The zalktis (the Latvian grass snake, its back worked in gold folk
// patterns) on mossy roots in an evening forest. Layers, back to front:
//
//   forest   the backdrop, darkened to the site's evening; travels least.
//   veil     the soft way in out of the section above.
//   title    the heading in the hero's glass lettering, in the upper left,
//            clear of the head; the line under it is text.
//   ground   the snake, the roots over the foot of its body and (in the
//            hero) the whisk, herbs and honey on the roots, moved as ONE
//            group so the body never parts from the ground; it grows
//            1 → 1.04 around the snake's eye, so the head stays put as the
//            camera closes in.
//   foliage  oak, birch and ferns round the edges; travels a little more.
//
// They are still pictures: nothing bends, slides or slithers. One scroll
// timeline per instance (framer-motion straight onto transforms, no React
// render per scroll step), so it runs backwards just as it runs forwards.
//
// Given children (the gift cards, and on the homepage the way here), the
// scene runs on downward into a mossy forest floor that does not move: the
// floor overlaps the stage's foot, its top fading in over the forest, a
// mossy ledge across the join and a fern at one side; the children are
// drawn over the stage's lower part and on down over the moss.
//
// Desktop: a 165svh section with a sticky full-height stage. Phones and
// upright tablets: no pinning, a stage sized to the picture, less travel,
// less foliage. Reduced motion: the finished composition in normal flow.
// `hero`: a page's first screen instead, the page's content drawn over its
// darkening lower edge (HERO_AFTER on what follows), as on the booking page.
// The layers load as the section comes near; until they have (or if one
// fails), a flattened copy of the scene stands in.

const MEDIA = '/media/zalktis';
const COMPACT = '(max-width: 767px), (orientation: portrait) and (max-width: 1024px)';
const HEADER = 68;
// Line pitch of a two-line title, in em.
const LINE_GAP = 1.0;
// The hero runs on below its scene by this much, darkening into the page.
const TAIL = { wide: 240, tall: 130 };
export const HERO_AFTER = 'zk-hero-after';
// Desktop: the floor overlaps this share of the stage, and the children
// start this far down it.
const FLOOR = { overlap: 0.22, top: 0.4 };

interface Picture {
  w: number;
  h: number;
  src: string;
  small: string;
  smallW: number;
}

const pic = (name: string, w: number, h: number, smallW: number): Picture => ({
  w,
  h,
  src: `${MEDIA}/${name}-${w}.webp`,
  small: `${MEDIA}/${name}-${smallW}.webp`,
  smallW,
});

const FOREST = pic('forest', 1672, 941, 960);
const SNAKE = pic('snake', 1672, 941, 960);
const ROOTS = pic('roots', 1672, 941, 960);
const FOLIAGE = pic('foliage', 1672, 941, 960);
const RITUAL = pic('ritual', 720, 469, 420);
const MASTER = pic('master', 1672, 941, 960);
// The floor below: moss seen from above, a mossy ledge and a fern.
const MOSS = pic('moss', 1672, 941, 960);
const LEDGE = pic('ledge', 1600, 533, 900);
const FERN = pic('fern', 739, 1099, 420);

// Points in the snake picture, as shares of its size (measured on its alpha).
const HEAD = {
  top: 0.165, // the crown of the head, the highest point
  eyeX: 0.817,
  eyeY: 0.223,
  tip: 0.99, // the tongue's tip
};
// The top of the near coil, the body's highest point under the title.
const HUMP_TOP = 0.27;
// How much of the snake stands above the stage's foot; the rest runs out below.
const SINK = 0.86;

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

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
  snake: Box;
  roots: Box;
  foliage: Box;
  ritual: Box | null;
  // The ground group's pivot: the snake's eye.
  eye: { x: number; y: number };
  // `top` is the first line's cap height; every line is `size` tall.
  title: { left: number; right: number; top: number; size: number };
  copy: { maxWidth: number; size: number };
}

const fit = (box: Box, iw: number, ih: number): Box => ({ ...box, h: (box.w * ih) / iw });

// The size at which the widest line (`widest` px at 100px) fills `width`,
// at most `max`.
const fitSize = (max: number, width: number, widest: number) =>
  widest > 0 ? Math.min(max, (width / widest) * 100 * 0.995) : max;

// `extend`: how far the stage runs on below the scene (the hero's tail).
const stageLayout = (W: number, H: number, lines: number, widest: number, ritual: boolean, extend = 0): Layout => {
  const forest = cover({ x: -0.04 * W, y: -0.1 * H, w: 1.08 * W, h: 1.2 * H + extend }, FOREST.w, FOREST.h, 0.5, 0.55);
  // The snake past the left edge and the foot; as large as the stage allows
  // with its head clear of the navigation.
  const maxH = (H - (HEADER + 0.2 * H)) / (SINK - HEAD.top);
  const snakeW = Math.min(0.98 * W, (maxH * SNAKE.w) / SNAKE.h);
  const snakeH = (snakeW * SNAKE.h) / SNAKE.w;
  const snake = { x: -0.04 * W, y: H - SINK * snakeH, w: snakeW, h: snakeH };
  const eye = { x: snake.x + HEAD.eyeX * snakeW, y: snake.y + HEAD.eyeY * snakeH };

  // The moss along the foot, its low left end over the body's lowest curve.
  const roots = fit({ x: -0.03 * W, y: 0, w: 1.06 * W, h: 0 }, ROOTS.w, ROOTS.h);
  roots.y = 0.9 * H - 0.6 * roots.h;
  // On the roots right of the coil, under the head.
  const ritualW = Math.min(0.15 * W, 260);
  const herbs = fit({ x: 0.79 * W, y: 0, w: ritualW, h: 0 }, RITUAL.w, RITUAL.h);
  herbs.y = H - 0.08 * H - herbs.h;

  // The frame larger than the stage, so its leaves only touch the corners.
  const foliage = cover({ x: -0.14 * W, y: -0.2 * H, w: 1.28 * W, h: 1.36 * H }, FOLIAGE.w, FOLIAGE.h);

  // The title in the upper left, above the coil.
  const left = 0.065 * W;
  const right = Math.min(0.52 * W, eye.x - 0.2 * snakeW);
  const top = HEADER + 0.07 * H;
  const copySize = Math.max(16, Math.min(20, W * 0.0125));
  const floor = snake.y + HUMP_TOP * snakeH - copySize * 3.6;
  const maxSize = Math.min(0.13 * H, (floor - top) / (0.74 + (lines - 1) * LINE_GAP));
  return {
    W,
    H,
    forest,
    snake,
    roots,
    foliage,
    ritual: ritual ? herbs : null,
    eye,
    title: { left, right, top, size: fitSize(maxSize, right - left, widest) },
    copy: { maxWidth: Math.max(300, right - left), size: copySize },
  };
};

// Phones: the title above, then the head and the near coil, the body's far
// end cut by the left edge.
const compactLayout = (W: number, lines: number, widest: number, copyLines: number, extend = 0): Layout & { stageH: number } => {
  const left = 0.06 * W;
  const right = 0.94 * W;
  const size = widest > 0 ? fitSize(120, right - left, widest) : Math.min((right - left) / 4.0, 120);
  const top = 56;
  const copySize = 16;
  const copyBottom = top + size * (0.74 + (lines - 1) * LINE_GAP) + size * 0.3 + copySize * 1.5 * copyLines;

  const snakeW = 1.6 * W;
  const snakeH = (snakeW * SNAKE.h) / SNAKE.w;
  // The tongue just inside the right edge.
  const snakeX = 0.985 * W - HEAD.tip * snakeW;
  const snakeY = copyBottom + 4 - HEAD.top * snakeH;
  const stageH = snakeY + 0.9 * snakeH;
  const snake = { x: snakeX, y: snakeY, w: snakeW, h: snakeH };
  const eye = { x: snakeX + HEAD.eyeX * snakeW, y: snakeY + HEAD.eyeY * snakeH };

  const roots = fit({ x: -0.25 * W, y: 0, w: 1.5 * W, h: 0 }, ROOTS.w, ROOTS.h);
  roots.y = stageH - 0.36 * roots.h;
  const forest = cover(
    { x: -0.05 * W, y: -0.05 * stageH, w: 1.1 * W, h: 1.1 * stageH + extend },
    FOREST.w,
    FOREST.h,
    0.4,
    0.5
  );
  // Only the ferns' tips at the lower corners and a twig at the top.
  const foliage = cover({ x: -0.3 * W, y: -0.12 * stageH, w: 1.6 * W, h: 1.28 * stageH }, FOLIAGE.w, FOLIAGE.h);
  return {
    W,
    H: stageH,
    stageH,
    forest,
    snake,
    roots,
    foliage,
    ritual: null,
    eye,
    title: { left, right, top, size },
    copy: { maxWidth: right - left, size: copySize },
  };
};

// A heading as lines: "Dabas spēks. Pirts miers." at its full stop, and on
// phones a two-word one ("Dāvanu kartes") a word a line, so it can be large.
const titleLines = (text: string, compact: boolean): string[] => {
  const at = text.indexOf('. ');
  if (at > 0) return [text.slice(0, at + 1), text.slice(at + 2)];
  const words = text.split(' ');
  if (!compact || words.length < 2) return [text];
  let best = 1;
  for (let i = 2; i < words.length; i++) {
    const diff = (n: number) => Math.abs(words.slice(0, n).join(' ').length - words.slice(n).join(' ').length);
    if (diff(i) < diff(best)) best = i;
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
};

// The title's lines, the widest of them at 100px in the glass face and the
// line under it at 16px in the page's face; measured again whenever more of
// the glass face has arrived.
const useTitle = (title: string, text: string, compact: boolean) => {
  const lines = useMemo(() => titleLines(title, compact), [title, compact]);
  const font = useGlassFont();
  return useMemo(() => {
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return { lines, widest: 0, copyWidth: 0 };
    ctx.font = `800 100px ${GLASS_FONT}`;
    const widest = Math.max(...lines.map((line) => ctx.measureText(line).width));
    ctx.font = `16px ${getComputedStyle(document.body).fontFamily}`;
    return { lines, widest, copyWidth: ctx.measureText(text).width };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, text, font]);
};

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

// True once the element is within a screen or so of the window (then stays).
const useNear = (ref: React.RefObject<HTMLElement>) => {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: '120% 0px 120% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, near]);
  return near;
};

interface Motion {
  forestY?: MotionValue<number>;
  titleY?: MotionValue<number>;
  titleOpacity?: MotionValue<number>;
  glassShift?: MotionValue<number>;
  groundY?: MotionValue<number>;
  groundScale?: MotionValue<number>;
  foliageY?: MotionValue<number>;
  foliageScale?: MotionValue<number>;
}

const srcSet = (p: Picture) => `${p.small} ${p.smallW}w, ${p.src} ${p.w}w`;

const Layer: React.FC<{ p: Picture; box: Box; W: number; className?: string; onDone?: (ok: boolean) => void; alt?: string }> = ({
  p,
  box,
  W,
  className = '',
  onDone,
  alt = '',
}) => (
  <img
    src={p.src}
    srcSet={srcSet(p)}
    sizes={`${Math.max(10, Math.round((box.w / W) * 100))}vw`}
    width={p.w}
    height={p.h}
    alt={alt}
    aria-hidden={alt ? undefined : true}
    decoding="async"
    draggable={false}
    onLoad={onDone && (() => onDone(true))}
    onError={onDone && (() => onDone(false))}
    className={`absolute max-w-none select-none ${className}`}
    style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
  />
);

// How the stage ends: into the page's background, into the moss floor, or
// (the hero) darkening over its tail of `footH` px.
type Foot = 'edge' | 'floor' | 'hero';

const SceneLayers: React.FC<{
  layout: Layout;
  lines: string[];
  text: string;
  motion?: Motion;
  near: boolean;
  compact?: boolean;
  foot: Foot;
  footH?: number;
}> = ({ layout, lines, text, motion: m = {}, near, compact, foot, footH }) => {
  const { t } = useTranslation('cards');

  // Every layer in, or one of them failed: the flattened scene stays.
  const layers = layout.ritual ? 5 : 4;
  const [loaded, setLoaded] = useState(0);
  const [failed, setFailed] = useState(false);
  const onDone = useCallback((ok: boolean) => (ok ? setLoaded((n) => n + 1) : setFailed(true)), []);
  const ready = near && !failed && loaded >= layers;

  const { W, H, forest, snake, roots, foliage, ritual, eye, title, copy } = layout;
  if (!W || !H) return null;
  const baseline = (i: number) => title.top + title.size * (0.74 + i * LINE_GAP);
  const last = baseline(lines.length - 1);

  return (
    <>
      {/* The flattened scene, while the layers load or if one fails. */}
      <img
        src={MASTER.small}
        srcSet={srcSet(MASTER)}
        sizes="100vw"
        alt=""
        aria-hidden="true"
        loading={foot === 'hero' ? undefined : 'lazy'}
        decoding="async"
        draggable={false}
        className={`zk-master absolute inset-x-0 top-0 w-full select-none object-cover ${ready ? 'opacity-0' : ''}`}
        style={{ height: H, objectPosition: compact ? '78% 60%' : '50% 70%' }}
      />

      {near && !failed && (
        <div className={`zk-layers absolute inset-0 ${ready ? 'zk-ready' : ''}`}>
          {/* 1. The forest. */}
          <motion.div aria-hidden="true" className="absolute inset-0" style={{ y: m.forestY }}>
            <Layer p={FOREST} box={forest} W={W} className="zk-forest" onDone={onDone} />
          </motion.div>
        </div>
      )}

      {/* 2. The veil. */}
      <div aria-hidden="true" className="zk-veil pointer-events-none absolute inset-0" />

      {/* 3. The title in the hero's glass, and the line under it; the scene's
          height, not the hero's with its tail, which would stretch the glass. */}
      <motion.div className="absolute inset-x-0 top-0" style={{ height: H, y: m.titleY, opacity: m.titleOpacity }}>
        {lines.map((line, i) => (
          <GlassTitle
            key={i}
            text={line}
            width={W}
            height={H}
            left={title.left}
            right={title.right}
            baseline={baseline(i)}
            maxSize={title.size}
            align="start"
            glass={{ src: FOREST.small, ...forest }}
            glassStyle={m.glassShift ? { y: m.glassShift } : undefined}
          />
        ))}
        <p
          className="zk-copy absolute m-0"
          style={{
            left: title.left + title.size * 0.03,
            top: last + title.size * 0.3,
            maxWidth: copy.maxWidth,
            fontSize: copy.size,
          }}
        >
          {text}
        </p>
      </motion.div>

      {near && !failed && (
        <div className={`zk-layers absolute inset-0 ${ready ? 'zk-ready' : ''}`}>
          {/* 4. The ground: snake, roots and ingredients as one. */}
          <motion.div
            className={`absolute inset-0 ${foot === 'floor' ? 'zk-ground-sink' : ''}`}
            style={{ y: m.groundY, scale: m.groundScale, transformOrigin: `${eye.x}px ${eye.y}px` }}
          >
            <Layer p={SNAKE} box={snake} W={W} className="zk-snake" onDone={onDone} alt={t('scene.alt')} />
            <Layer p={ROOTS} box={roots} W={W} className="zk-roots" onDone={onDone} />
            {ritual && <Layer p={RITUAL} box={ritual} W={W} className="zk-ritual" onDone={onDone} />}
          </motion.div>

          {/* 5. The foliage round the edges. */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ y: m.foliageY, scale: m.foliageScale, transformOrigin: '50% 50%' }}
          >
            <Layer p={FOLIAGE} box={foliage} W={W} className={`zk-foliage ${compact ? 'zk-foliage-compact' : ''}`} onDone={onDone} />
          </motion.div>
        </div>
      )}

      {/* 6. Out of the section above, over the leaves too, and on down. */}
      <div aria-hidden="true" className={`pointer-events-none absolute inset-x-0 top-0 ${foot === 'hero' ? 'zk-top-hero' : 'zk-top'}`} />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 bottom-0 zk-foot-${foot}`}
        style={{ height: foot === 'hero' ? footH : foot === 'floor' ? '32%' : compact ? '14%' : '24%' }}
      />
    </>
  );
};

// ------------------------------------------------------------- the floor

// The mossy forest floor under the stage, still: it overlaps the stage's
// last `overlap` px, fading in over it, and the children start `lift` px
// above its top. The ledge lies across the join, the fern on its high left
// end; the moss itself fades out at the foot into the page, always well
// below the ledge, so the ledge never hangs over the dark.
// `tight`: the floor ends just under its children and the moss runs on to
// its very foot, so the page's next part (the footer) follows straight on,
// with no bare moss or dark band between.
const Floor: React.FC<{
  W: number;
  overlap: number;
  lift: number;
  minHeight: number;
  compact: boolean;
  tight?: boolean;
  children: ReactNode;
}> = ({ W, overlap, lift, minHeight, compact, tight = false, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const near = useNear(ref);
  // Its dip (about halfway down the picture) still over the fade, so no
  // stretch of the join is left bare.
  const ledge = fit({ x: (compact ? -0.62 : -0.06) * W, y: 0, w: (compact ? 2.2 : 1.12) * W, h: 0 }, LEDGE.w, LEDGE.h);
  ledge.y = overlap - 0.5 * ledge.h;
  // On the ledge's high left end, leaning in behind the cards.
  const fern = fit({ x: (compact ? -0.12 : -0.045) * W, y: 0, w: compact ? 0.4 * W : Math.min(0.18 * W, 360), h: 0 }, FERN.w, FERN.h);
  fern.y = ledge.y + 0.34 * ledge.h - fern.h;
  // On phones no higher than the cards, clear of the words above them.
  if (compact) fern.y = Math.max(fern.y, -lift);
  // The moss is whole down to 72% of the floor (.zk-moss).
  // Tight: down to where the ledge has faded (.zk-ledge), no further.
  const floorH = tight ? ledge.y + 0.76 * ledge.h : Math.max(minHeight, (ledge.y + ledge.h) / 0.6);
  return (
    <div
      ref={ref}
      className="zk-floor relative z-10 flow-root"
      style={{ marginTop: -overlap, minHeight: floorH, ['--zk-overlap' as string]: `${overlap}px` }}
    >
      {near && W > 0 && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-x-clip">
          <img
            src={MOSS.src}
            srcSet={srcSet(MOSS)}
            sizes="100vw"
            alt=""
            decoding="async"
            draggable={false}
            className={`zk-moss absolute inset-x-0 top-0 w-full max-w-none select-none object-cover object-top ${tight ? 'zk-moss-fit' : ''}`}
            style={{ height: tight ? '100%' : compact ? 'min(100%, 290vw)' : 'min(100%, 115vw)' }}
          />
          <div className="zk-floor-shade absolute inset-0" />
          <Layer p={LEDGE} box={ledge} W={W} className="zk-ledge" />
          <Layer p={FERN} box={fern} W={W} className="zk-fern" />
          {/* Tight: the moss and the ledge dissolve into the footer below
              instead of being cut off by it. */}
          {tight && <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-[#0a0a0a]" />}
        </div>
      )}
      <div className="relative" style={{ marginTop: -lift }}>
        {children}
      </div>
    </div>
  );
};

interface StageProps {
  title: string;
  text: string;
  children?: ReactNode;
  tight?: boolean;
}

// ------------------------------------------------------------- desktop

const ScrollStage: React.FC<StageProps> = ({ title, text, children, tight }) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const { W, H } = useStageSize(stageRef);
  const near = useNear(sectionRef);
  const { lines, widest } = useTitle(title, text, false);
  // 0: the section's top at the window's foot; ~0.43 the stage reaches the
  // top and holds; ~0.57 it lets go; 1 its foot leaves the window.
  const { scrollYProgress: p } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] });

  const forestY = useTransform(p, [0, 1], [70, -70]);
  const titleY = useTransform(p, [0.18, 0.44, 1], [80, 0, -60]);
  const titleOpacity = useTransform(p, [0.2, 0.42], [0, 1]);
  const groundY = useTransform(p, [0, 0.43, 0.57, 1], [110, 30, 0, -40]);
  const groundScale = useTransform(p, [0.12, 0.57], [1, 1.04]);
  const foliageY = useTransform(p, [0, 0.43, 0.57, 1], [170, 50, 0, -110]);
  const foliageScale = useTransform(p, [0.12, 0.57, 1], [1, 1.05, 1.07]);
  const glassShift = useTransform(() => forestY.get() - titleY.get());

  return (
    <>
      <div ref={sectionRef} className="zk-scroll relative">
        <div ref={stageRef} className="zk-stage sticky top-0 overflow-hidden">
          <SceneLayers
            layout={stageLayout(W, H, lines.length, widest, !children)}
            lines={lines}
            text={text}
            near={near}
            foot={children ? 'floor' : 'edge'}
            motion={{ forestY, titleY, titleOpacity, glassShift, groundY, groundScale, foliageY, foliageScale }}
          />
        </div>
      </div>
      {children && (
        <Floor W={W} overlap={FLOOR.overlap * H} lift={(1 - FLOOR.overlap - FLOOR.top) * H} minHeight={0.55 * H} compact={false} tight={tight}>
          {children}
        </Floor>
      )}
    </>
  );
};

const StaticStage: React.FC<StageProps> = ({ title, text, children, tight }) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { W, H } = useStageSize(sectionRef);
  const near = useNear(sectionRef);
  const { lines, widest } = useTitle(title, text, false);
  return (
    <>
      <div ref={sectionRef} className="zk-stage relative overflow-hidden">
        <SceneLayers
          layout={stageLayout(W, H, lines.length, widest, !children)}
          lines={lines}
          text={text}
          near={near}
          foot={children ? 'floor' : 'edge'}
        />
      </div>
      {children && (
        <Floor W={W} overlap={FLOOR.overlap * H} lift={(1 - FLOOR.overlap - FLOOR.top) * H} minHeight={0.55 * H} compact={false} tight={tight}>
          {children}
        </Floor>
      )}
    </>
  );
};

// ------------------------------------------------------------- compact

const copyLinesOf = (copyWidth: number, W: number) => (W ? Math.max(1, Math.ceil((copyWidth * 1.05) / (0.88 * W))) : 2);

const CompactStage: React.FC<StageProps & { reduced: boolean }> = ({ title, text, children, tight, reduced }) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { W } = useStageSize(sectionRef);
  const near = useNear(sectionRef);
  const { lines, widest, copyWidth } = useTitle(title, text, true);
  const layout = compactLayout(W, lines.length, widest, copyLinesOf(copyWidth, W));
  const { scrollYProgress: p } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] });
  const still = [0, 0];
  const forestY = useTransform(p, [0, 1], reduced ? still : [24, -24]);
  const titleY = useTransform(p, [0, 0.5, 1], reduced ? [0, 0, 0] : [30, 0, -14]);
  const groundY = useTransform(p, [0, 0.5, 1], reduced ? [0, 0, 0] : [40, 0, -12]);
  const groundScale = useTransform(p, [0, 0.6], reduced ? [1, 1] : [1, 1.025]);
  const foliageY = useTransform(p, [0, 1], reduced ? still : [56, -44]);
  const glassShift = useTransform(() => forestY.get() - titleY.get());
  // The children start just under the head, over the coil.
  const overlap = 0.2 * layout.stageH;
  const contentTop = layout.snake.y + 0.36 * layout.snake.h;
  return (
    <>
      <div ref={sectionRef} className="relative overflow-hidden" style={{ height: layout.stageH || '150vw' }}>
        <SceneLayers
          layout={layout}
          lines={lines}
          text={text}
          near={near}
          foot={children ? 'floor' : 'edge'}
          motion={{ forestY, titleY, glassShift, groundY, groundScale, foliageY }}
          compact
        />
      </div>
      {children && (
        <Floor
          W={W}
          overlap={overlap}
          lift={Math.max(0, layout.stageH - overlap - contentTop)}
          minHeight={0.25 * layout.stageH}
          compact
          tight={tight}
        >
          {children}
        </Floor>
      )}
    </>
  );
};

// ------------------------------------------------------------- hero

const HeroStage: React.FC<StageProps & { compact: boolean; reduced: boolean; edge: string; headingId?: string }> = ({
  title,
  text,
  compact,
  reduced,
  edge,
  headingId,
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const { W, H } = useStageSize(sectionRef);
  const { lines, widest, copyWidth } = useTitle(title, text, compact);
  const tail = compact ? TAIL.tall : TAIL.wide;
  const layout = compact
    ? compactLayout(W, lines.length, widest, copyLinesOf(copyWidth, W), tail)
    : stageLayout(W, Math.max(0, H - tail), lines.length, widest, true, tail);
  const sceneH = layout.H;
  // As the hero scrolls away the forest lags most and the foliage leads.
  const { scrollYProgress: p } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const k = reduced ? 0 : H;
  const forestY = useTransform(p, [0, 1], [0, 0.22 * k]);
  const titleY = useTransform(p, [0, 1], [0, 0.16 * k]);
  const groundY = useTransform(p, [0, 1], [0, 0.08 * k]);
  const foliageY = useTransform(p, [0, 1], [0, -0.06 * k]);
  const glassShift = useTransform(() => forestY.get() - titleY.get());
  return (
    <section
      ref={sectionRef}
      aria-labelledby={headingId}
      className={`zk zk-hero relative isolate overflow-hidden ${compact ? '' : 'zk-hero-tall'}`}
      style={{ ['--zk-edge' as string]: edge, height: compact ? (layout.stageH || 600) + tail : undefined }}
    >
      <style>{CSS}</style>
      <h1 id={headingId} className="sr-only">
        {title}
      </h1>
      <SceneLayers
        layout={layout}
        lines={lines}
        text={text}
        near
        compact={compact}
        foot="hero"
        footH={tail + sceneH * 0.16}
        motion={{ forestY, titleY, glassShift, groundY, foliageY }}
      />
    </section>
  );
};

type Mode = 'stage' | 'compact';
const pickMode = (): Mode => (window.matchMedia(COMPACT).matches ? 'compact' : 'stage');

export interface ZalktisSceneProps {
  // The heading, in glass, and the line under it.
  title: string;
  text: string;
  // The page's background above and below, which the scene fades from and into.
  edge?: string;
  id?: string;
  // The real (screen-reader) heading's id: an h2, or the hero's h1.
  headingId?: string;
  hero?: boolean;
  // Drawn over the stage's lower part and on down over the moss floor.
  children?: ReactNode;
  // The floor ends with the children (see Floor).
  tight?: boolean;
}

const ZalktisScene: React.FC<ZalktisSceneProps> = ({ title, text, edge = '#000', id, headingId, hero, children, tight }) => {
  const reduced = useReducedMotion() ?? false;
  const [mode, setMode] = useState<Mode>(pickMode);
  useEffect(() => {
    const query = window.matchMedia(COMPACT);
    const onChange = () => setMode(pickMode());
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  if (hero) {
    return <HeroStage title={title} text={text} compact={mode === 'compact'} reduced={reduced} edge={edge} headingId={headingId} />;
  }
  const props = { title, text, children, tight };
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="zk relative scroll-mt-16"
      style={{ ['--zk-edge' as string]: edge }}
    >
      <style>{CSS}</style>
      <h2 id={headingId} className="sr-only">
        {title}
      </h2>
      {mode === 'compact' ? <CompactStage {...props} reduced={reduced} /> : reduced ? <StaticStage {...props} /> : <ScrollStage {...props} />}
    </section>
  );
};

const CSS = `
.zk { background: var(--zk-edge); }
.zk-scroll { height: 135vh; height: 135svh; }
.zk-stage { height: 100vh; height: 100svh; }

.zk-hero { --bar: ${HEADER}px; --tail: ${TAIL.wide}px; margin-top: var(--bar); }
@media (min-width: 1024px) { .zk-hero { --bar: 0px; } }
.zk-hero-tall {
  height: calc(100vh - var(--bar) + var(--tail)); height: calc(100svh - var(--bar) + var(--tail));
  min-height: calc(560px + var(--tail)); max-height: calc(1080px + var(--tail));
}
/* What follows the hero starts a little above its tail, on the moss. */
.${HERO_AFTER} { position: relative; z-index: 10; margin-top: -${TAIL.wide + 110}px; }
@media ${COMPACT} { .${HERO_AFTER} { margin-top: -${TAIL.tall + 40}px; } }

.zk-master { transition: opacity 700ms ease; }
.zk-layers { opacity: 0; transition: opacity 700ms ease; }
.zk-layers.zk-ready { opacity: 1; }
.zk-layers > div, .zk-layers img { will-change: transform; }

.zk-forest { filter: brightness(0.5) saturate(0.9) contrast(1.05) blur(1.5px); }
.zk-veil {
  background:
    linear-gradient(100deg, rgba(3, 9, 5, 0.55) 0%, rgba(3, 9, 5, 0.25) 35%, rgba(3, 9, 5, 0) 60%),
    radial-gradient(120% 90% at 60% 45%, rgba(4, 12, 7, 0) 45%, rgba(2, 6, 3, 0.5) 100%);
}
/* The cut-outs brought to the forest's evening light. */
.zk-snake { filter: brightness(0.92) saturate(0.95) contrast(1.04) drop-shadow(0 18px 28px rgba(0, 0, 0, 0.45)); }
.zk-roots { filter: brightness(0.78) saturate(0.9) contrast(1.04); }
.zk-ritual { filter: brightness(0.78) saturate(0.9) drop-shadow(0 10px 18px rgba(0, 0, 0, 0.5)); }
.zk-foliage { filter: brightness(0.62) saturate(0.9) blur(1px); }
.zk-foliage-compact { opacity: 0.85; }
/* In out of the page above: long and eased, so no line shows. */
.zk-top {
  height: 38%;
  background: linear-gradient(180deg,
    var(--zk-edge) 0%,
    color-mix(in srgb, var(--zk-edge) 94%, transparent) 10%,
    color-mix(in srgb, var(--zk-edge) 78%, transparent) 26%,
    color-mix(in srgb, var(--zk-edge) 52%, transparent) 46%,
    color-mix(in srgb, var(--zk-edge) 24%, transparent) 68%,
    color-mix(in srgb, var(--zk-edge) 7%, transparent) 86%,
    transparent 100%);
}
.zk-top-hero {
  height: 52%;
  background: linear-gradient(180deg, rgba(6, 11, 7, 0.62) 0%, rgba(6, 11, 7, 0.2) 60%, transparent 100%);
}
.zk-foot-edge {
  background: linear-gradient(0deg, var(--zk-edge) 0%, color-mix(in srgb, var(--zk-edge) 78%, transparent) 30%, transparent 100%);
}
/* Over the floor, the body sinks into the shade before the moss comes in,
   so it never shows through the moss as a ghost. */
.zk-ground-sink {
  -webkit-mask-image: linear-gradient(180deg, #000 70%, rgba(0, 0, 0, 0.45) 82%, transparent 94%);
  mask-image: linear-gradient(180deg, #000 70%, rgba(0, 0, 0, 0.45) 82%, transparent 94%);
}
/* Into the moss: only the light brought down to the floor's. */
.zk-foot-floor { background: linear-gradient(0deg, rgba(5, 8, 4, 0.55) 0%, rgba(5, 8, 4, 0.22) 50%, transparent 100%); }
.zk-foot-hero {
  background: linear-gradient(180deg, transparent 0%,
    color-mix(in srgb, var(--zk-edge) 55%, transparent) 34%,
    color-mix(in srgb, var(--zk-edge) 86%, transparent) 64%,
    var(--zk-edge) 100%);
}
.zk-copy {
  color: rgba(244, 239, 228, 0.86);
  line-height: 1.5;
  text-shadow: 0 1px 12px rgba(0, 0, 0, 0.6);
}

/* The floor: the moss fades in over the stage's foot (the overlap), and
   out at its own foot into the page. */
.zk-moss {
  filter: brightness(0.46) saturate(0.82) contrast(1.06);
  -webkit-mask-image: linear-gradient(180deg, transparent 0, rgba(0, 0, 0, 0.1) calc(var(--zk-overlap) * 0.3), rgba(0, 0, 0, 0.55) calc(var(--zk-overlap) * 0.65), #000 var(--zk-overlap), #000 72%, transparent 100%);
  mask-image: linear-gradient(180deg, transparent 0, rgba(0, 0, 0, 0.1) calc(var(--zk-overlap) * 0.3), rgba(0, 0, 0, 0.55) calc(var(--zk-overlap) * 0.65), #000 var(--zk-overlap), #000 72%, transparent 100%);
}
.zk-moss.zk-moss-fit {
  -webkit-mask-image: linear-gradient(180deg, transparent 0, rgba(0, 0, 0, 0.1) calc(var(--zk-overlap) * 0.3), rgba(0, 0, 0, 0.55) calc(var(--zk-overlap) * 0.65), #000 var(--zk-overlap), #000 calc(100% - 90px), rgba(0, 0, 0, 0.6) 100%);
  mask-image: linear-gradient(180deg, transparent 0, rgba(0, 0, 0, 0.1) calc(var(--zk-overlap) * 0.3), rgba(0, 0, 0, 0.55) calc(var(--zk-overlap) * 0.65), #000 var(--zk-overlap), #000 calc(100% - 90px), rgba(0, 0, 0, 0.6) 100%);
}
.zk-floor-shade {
  background: linear-gradient(180deg, transparent 0, rgba(4, 7, 3, 0.18) var(--zk-overlap), rgba(4, 7, 3, 0.34) 55%, rgba(4, 7, 3, 0.15) 100%);
}
.zk-ledge {
  filter: brightness(0.6) saturate(0.85) contrast(1.05) drop-shadow(0 -10px 24px rgba(0, 0, 0, 0.4));
  -webkit-mask-image: linear-gradient(180deg, #000 72%, transparent 100%);
  mask-image: linear-gradient(180deg, #000 72%, transparent 100%);
}
.zk-fern { filter: brightness(0.55) saturate(0.85) drop-shadow(0 12px 22px rgba(0, 0, 0, 0.45)); }

@media (prefers-reduced-motion: reduce) {
  .zk-master, .zk-layers { transition: none; }
}
`;

export default ZalktisScene;
