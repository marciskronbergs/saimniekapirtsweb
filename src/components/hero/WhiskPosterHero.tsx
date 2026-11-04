import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';

// The homepage hero: a forest clearing with the sauna far off, the name in
// glass lettering, a mossy log with three bowls (salt, honey, herbs) across
// the foot, a hand holding a birch whisk, and birch leaves and ferns at the
// edges nearest the camera. Back to front: forest, title, log, whisk,
// foliage, then the words and buttons over all of it.
//
// Adapted from 21st.dev's "Sakura Editorial Poster" (design-layer.com): the
// same poster frame, the oversized condensed title fitted to the width and
// revealed letter by letter from the middle out, and a foreground cut-out in
// front of the title. Changed here: the title is glass (an SVG that shows the
// forest, slightly refracted, through the actual letter shapes), the reveal
// plays on arrival rather than over a long scroll, and pointer and scroll add
// a small depth parallax. Everything moves in requestAnimationFrame by
// writing styles straight onto the layers; React does not re-render while it
// runs. Each new layer sits in nested wrappers with one job each (scroll,
// pointer, layout box, entrance), so no transform overwrites another.
//
// The log and its bowls are one picture and move as one. The sequence waits
// for the pictures to decode (at most START_WAIT), so nothing pops in late.

const FOREST = {
  src: '/media/hero/clearing-1850.webp',
  srcSet: '/media/hero/clearing-800.webp 800w, /media/hero/clearing-1280.webp 1280w, /media/hero/clearing-1850.webp 1850w',
  // The same as the homepage's preload (scripts/prerender.mjs).
  sizes: '(orientation: portrait) 1850px, 145vw',
  small: '/media/hero/clearing-800.webp',
  w: 1850,
  h: 850,
};
// The sauna's cabin in the clearing, as shares of the picture.
const SAUNA_X = 0.43;
// The log with the bowls, trimmed to its alpha; the bowls run from 16% to
// 86% of its width, their rims from 22% of its height.
const BOWLS = {
  src: '/media/hero/bowls-1400.webp',
  srcSet: '/media/hero/bowls-800.webp 800w, /media/hero/bowls-1400.webp 1400w, /media/hero/bowls-1842.webp 1842w',
  sizes: '(orientation: portrait) 130vw, 52vw',
  w: 1842,
  h: 527,
  from: 0.16,
  to: 0.86,
  rim: 0.22,
};
// The three corner clusters of one 1850 × 850 foliage frame, each trimmed
// to its alpha: birch leaves top left, ferns bottom left and bottom right.
const LEAVES = [
  { name: 'leaves-tl', w: 453, h: 400 },
  { name: 'ferns-bl', w: 698, h: 459 },
  { name: 'ferns-br', w: 621, h: 503 },
] as const;
const leafSrcSet = (l: (typeof LEAVES)[number]) =>
  `/media/hero/${l.name}-${Math.round(l.w / 2)}.webp ${Math.round(l.w / 2)}w, /media/hero/${l.name}-${l.w}.webp ${l.w}w`;
const START_WAIT = 1400;
const WHISK = { src: '/media/hero/whisk-1672.webp', small: '/media/hero/whisk-960.webp', w: 1672, h: 941 };
// Points in the whisk picture, as shares of its size.
const ARM_EXIT_X = 0.76; // where the forearm leaves the bottom edge
const FOREARM_AT_EDGE_X = 0.676; // past the wrist, before the picture ends
const CROWN_TOP_Y = 0.017; // top of the leaves
const HAND = { x: 0.62, y: 0.84 }; // the whisk turns around the hand

const TITLE = 'SaimniekaPirts';
const TITLE_FONT = '"Saira Extra Condensed", "Arial Narrow", sans-serif';
const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Saira+Extra+Condensed:wght@800&display=swap';
const FONT_LINK_ID = 'hero-title-font';
const SVG_NS = 'http://www.w3.org/2000/svg';

// Parallax reach in CSS pixels, back to front: the forest least, the near
// foliage most.
const DEPTH = { forest: 4, title: 5, bowls: 8, whisk: 12, whiskTurn: 0.9, foliage: 14 };
// Scroll speed of each layer relative to the page as the hero leaves. The
// whisk moves with the page: lifting it would show where the forearm ends.
// The foliage leads a little; it reaches FOLIAGE_OVERSCAN below the frame,
// so its cut edge never comes into view.
const SCROLL = { forest: 0.3, title: 0.16, bowls: 0.07, whisk: 0, foliage: -0.04 };
const FOLIAGE_OVERSCAN = 0.07;
// How far the forearm reaches past the frame's edge, as a share of the
// picture's height; more than the parallax and the turn can ever move it.
const ARM_OVERSCAN = 0.09;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const span = (t: number, from: number, to: number) => clamp01((t - from) / (to - from));

// The original's letter reveal: the middle letters first, the ends last.
function charReveal(progress: number, fromCenter: number) {
  const start = fromCenter * 0.55;
  const end = Math.min(1, start + 0.38);
  return clamp01((progress - start) / Math.max(0.001, end - start));
}

interface Glyph {
  el: SVGTextElement;
  fromCenter: number;
  side: number;
}

const WhiskPosterHero: React.FC = () => {
  const { t } = useTranslation('hero');
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  // Each layer: scroll wrapper, pointer wrapper, layout box, entrance.
  const forestScrollRef = useRef<HTMLDivElement>(null);
  const forestPointerRef = useRef<HTMLDivElement>(null);
  const forestImgRef = useRef<HTMLImageElement>(null);
  const bowlsScrollRef = useRef<HTMLDivElement>(null);
  const bowlsPointerRef = useRef<HTMLDivElement>(null);
  const bowlsBoxRef = useRef<HTMLDivElement>(null);
  const bowlsEnterRef = useRef<HTMLDivElement>(null);
  const foliageScrollRef = useRef<HTMLDivElement>(null);
  const foliagePointerRef = useRef<HTMLDivElement>(null);
  const foliageEnterRef = useRef<HTMLDivElement>(null);
  const leafRefs = useRef<(HTMLImageElement | null)[]>([]);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const glyphsRef = useRef<SVGGElement>(null);
  const refractRef = useRef<SVGImageElement>(null);
  const whiskRef = useRef<HTMLImageElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  // False when the glass title cannot be built: plain translucent text then.
  const [glass, setGlass] = useState(true);

  useEffect(() => {
    // The letters are placed from measurements, so they are measured again
    // once the typeface's stylesheet and the face itself have arrived.
    let fontLink = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null;
    if (!fontLink) {
      fontLink = document.createElement('link');
      fontLink.id = FONT_LINK_ID;
      fontLink.rel = 'stylesheet';
      fontLink.href = FONT_HREF;
      document.head.appendChild(fontLink);
    }

    const section = sectionRef.current!;
    const stage = stageRef.current!;
    const svg = svgRef.current!;
    const glyphGroup = glyphsRef.current!;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(pointer: fine)').matches;

    // Upright layout: the whisk sits exactly at the edge, so it does not drift.
    let portrait = false;
    let W = 0;
    let H = 0;
    let glyphs: Glyph[] = [];
    let raf = 0;
    let visible = true;
    let cancelled = false;
    // Set once the pictures have decoded (or START_WAIT has passed).
    let startTime = reduced ? 0 : -1;
    // The forest's box in the stage, shared with the glass inside the letters.
    let forestBox = { x: 0, y: 0, w: 0, h: 0 };
    // Pointer, from -1 to 1 across the stage, and its damped follower.
    const pointer = { x: 0, y: 0 };
    const eased = { x: 0, y: 0 };

    // ---- layout

    const placeWhisk = (portrait: boolean) => {
      let w: number;
      let top: number;
      let left: number;
      if (!portrait) {
        // The picture reaches below the frame, so the forearm runs out of
        // view; the left side stays free for the words.
        const h = H * 0.95;
        w = (h * WHISK.w) / WHISK.h;
        top = H - h + h * ARM_OVERSCAN;
        left = W * 0.97 - ARM_EXIT_X * w;
      } else {
        // Phones and tablets upright: the leaves over the second line of the
        // title and the forearm leaving through the right edge, so the cut
        // at the picture's bottom always falls outside the stage.
        w = Math.min(W * 1.6, H * 1.15);
        const h = (w * WHISK.h) / WHISK.w;
        top = H * 0.2 - CROWN_TOP_Y * h;
        // The right edge crosses the forearm between the wrist (at most
        // 0.67 of the picture's width) and the picture's own end (from
        // 0.684): the whole hand shows and the cut never does. No pointer
        // drift in this layout, so nothing moves the cut into view.
        left = W - FOREARM_AT_EDGE_X * w;
      }
      const h = (w * WHISK.h) / WHISK.w;
      const img = whiskRef.current!;
      Object.assign(img.style, {
        left: `${left}px`,
        top: `${top}px`,
        width: `${w}px`,
        height: `${h}px`,
        transformOrigin: `${HAND.x * 100}% ${HAND.y * 100}%`,
      });
      return { left, top, w, h };
    };

    // The forest covers the stage plus 4% on every side, slid sideways so
    // the sauna's cabin stands at `saunaAt`: in the gap between the words
    // and the whisk's leaves, seen but not in the way.
    const placeForest = (saunaAt: number) => {
      const bw = 1.08 * W;
      const bh = 1.08 * H;
      const s = Math.max(bw / FOREST.w, bh / FOREST.h);
      const w = FOREST.w * s;
      const h = FOREST.h * s;
      const x = Math.min(-0.04 * W, Math.max(-0.04 * W - (w - bw), saunaAt - SAUNA_X * w));
      forestBox = { x, y: -0.04 * H + (bh - h) / 2, w, h };
      Object.assign(forestImgRef.current!.style, {
        left: `${forestBox.x}px`,
        top: `${forestBox.y}px`,
        width: `${w}px`,
        height: `${h}px`,
      });
    };

    // The forest inside the letters, in the same box as the forest behind them.
    const placeRefraction = () => {
      const img = refractRef.current!;
      img.setAttribute('x', String(forestBox.x));
      img.setAttribute('y', String(forestBox.y));
      img.setAttribute('width', String(forestBox.w));
      img.setAttribute('height', String(forestBox.h));
    };

    const placeBox = (el: HTMLElement, x: number, y: number, w: number, h: number) =>
      Object.assign(el.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });

    // The log low across the middle, its foot cut by the frame, the bowls
    // clear of the hand. Desktop: its rims below the buttons where they
    // share the same stretch. Upright: wider than the stage (the log's ends
    // cut, the bowls kept), at the foot under the words.
    const placeBowls = (portrait: boolean, whisk: { left: number; w: number }) => {
      const box = bowlsBoxRef.current!;
      if (portrait) {
        const w = 1.3 * W;
        const h = (w * BOWLS.h) / BOWLS.w;
        placeBox(box, 0.5 * W - 0.51 * w, H - 0.88 * h, w, h);
        return h;
      }
      let w = Math.min(0.52 * W, 1.15 * H);
      const handLeft = whisk.left + 0.56 * whisk.w;
      let x = Math.min(0.5 * W - w / 2, handLeft - BOWLS.to * w - 0.02 * W);
      let h = (w * BOWLS.h) / BOWLS.w;
      const buttons = buttonsRef.current?.getBoundingClientRect();
      const stageBox = stage.getBoundingClientRect();
      if (buttons && buttons.width) {
        const right = buttons.right - stageBox.left + 16;
        const bottom = buttons.bottom - stageBox.top + 12;
        const rimY = H - 0.9 * h + BOWLS.rim * h;
        if (rimY < bottom && x + BOWLS.from * w < right) {
          // Past the buttons, and no further than the hand allows.
          x = right - BOWLS.from * w;
          const room = handLeft - 0.02 * W - x;
          if (BOWLS.to * w > room) {
            w = room / BOWLS.to;
            h = (w * BOWLS.h) / BOWLS.w;
          }
        }
      }
      placeBox(box, x, H - 0.9 * h, w, h);
      return h;
    };

    // The near foliage at the corners, in the size of the frame it was cut
    // from; its lower clusters run below the frame. Upright: only the birch
    // leaves, smaller; the ferns would crowd the words and the log.
    const placeFoliage = (portrait: boolean) => {
      const k = W / 1850;
      const over = FOLIAGE_OVERSCAN * H;
      const [tl, bl, br] = leafRefs.current;
      if (portrait) {
        const s = (0.38 * W) / LEAVES[0].w;
        placeBox(tl!, -0.02 * W, -0.01 * H, LEAVES[0].w * s, LEAVES[0].h * s);
        bl!.style.display = 'none';
        br!.style.display = 'none';
        return;
      }
      bl!.style.display = '';
      br!.style.display = '';
      const s0 = 0.9 * k;
      placeBox(tl!, -0.012 * W, -0.015 * H, LEAVES[0].w * s0, LEAVES[0].h * s0);
      const s1 = 0.74 * k;
      placeBox(bl!, -0.015 * W, H + over - LEAVES[1].h * s1, LEAVES[1].w * s1, LEAVES[1].h * s1);
      const s2 = 0.6 * k;
      placeBox(br!, 1.012 * W - LEAVES[2].w * s2, H + over - LEAVES[2].h * s2, LEAVES[2].w * s2, LEAVES[2].h * s2);
    };

    // One <text> per letter, placed where the browser would set the word, so
    // each can be revealed on its own like the original.
    const buildTitle = (portrait: boolean) => {
      const lines = portrait ? ['Saimnieka', 'Pirts'] : [TITLE];
      const probe = document.createElementNS(SVG_NS, 'text');
      probe.setAttribute('font-family', TITLE_FONT);
      probe.setAttribute('font-weight', '800');
      probe.setAttribute('font-size', '100');
      probe.setAttribute('visibility', 'hidden');
      svg.appendChild(probe);
      const measured = lines.map((line) => {
        probe.textContent = line;
        const width = probe.getComputedTextLength();
        const xs = Array.from(line, (_, i) => probe.getStartPositionOfChar(i).x);
        return { line, width, xs };
      });
      probe.remove();
      const widest = Math.max(...measured.map((m) => m.width));
      if (!widest || !Number.isFinite(widest)) throw new Error('title could not be measured');

      const lineGap = 0.86;
      const byWidth = ((W * (portrait ? 0.9 : 0.92)) / widest) * 100;
      const byHeight = (H * (portrait ? 0.42 : 0.4)) / (lines.length * lineGap);
      const size = Math.min(byWidth, byHeight);
      const top = H * (portrait ? 0.05 : 0.07);

      glyphGroup.replaceChildren();
      glyphs = [];
      const total = TITLE.length;
      const mid = (total - 1) / 2;
      let n = 0;
      measured.forEach((m, row) => {
        const scale = size / 100;
        const x0 = (W - m.width * scale) / 2;
        const baseline = top + size * 0.8 + row * size * lineGap;
        Array.from(m.line).forEach((ch, i) => {
          const el = document.createElementNS(SVG_NS, 'text');
          el.textContent = ch;
          el.setAttribute('x', String(x0 + m.xs[i] * scale));
          el.setAttribute('y', String(baseline));
          el.setAttribute('font-family', TITLE_FONT);
          el.setAttribute('font-weight', '800');
          el.setAttribute('font-size', String(size));
          glyphGroup.appendChild(el);
          glyphs.push({ el, fromCenter: Math.abs(n - mid) / mid, side: n < total / 2 ? 1 : -1 });
          n++;
        });
      });
      // The rim and shading filters scale with the letters.
      svg.querySelector('#hero-inner-blur')?.setAttribute('stdDeviation', String(Math.max(2, size * 0.035)));
      svg.querySelector('#hero-shadow-blur')?.setAttribute('stdDeviation', String(Math.max(3, size * 0.05)));
      svg.querySelector('#hero-displace')?.setAttribute('scale', String(Math.max(6, size * 0.07)));
      // Where the letters end, for the words placed below them.
      return top + size * 0.8 + (lines.length - 1) * size * lineGap + size * 0.12;
    };

    // Desktop: the words in the open forest under the title, left of the
    // leaves. Upright screens: near the foot, under the whisk, the buttons
    // just above the bowls' rims and the honey dipper over them.
    const placeCopy = (portrait: boolean, titleBottom: number, whisk: { left: number; w: number }, bowlsH: number) => {
      const copy = copyRef.current!;
      if (portrait) {
        const padding = parseFloat(getComputedStyle(copy).paddingBottom) || 0;
        const bottom = Math.max(0, (0.88 - BOWLS.rim + 0.08) * bowlsH - padding + 12);
        Object.assign(copy.style, { top: 'auto', bottom: `${bottom}px`, maxWidth: '' });
        return;
      }
      const pad = W >= 1024 ? 48 : 32;
      const leavesLeft = whisk.left + 0.215 * whisk.w;
      Object.assign(copy.style, {
        top: `${titleBottom + H * 0.05}px`,
        bottom: 'auto',
        maxWidth: `${Math.max(320, leavesLeft - 32)}px`,
        paddingLeft: `${pad}px`,
      });
    };

    const layout = () => {
      W = stage.clientWidth;
      H = stage.clientHeight;
      if (!W || !H) return;
      portrait = W < H * 0.95;
      if (portrait) {
        pointer.x = 0;
        pointer.y = 0;
      }
      const whisk = placeWhisk(portrait);
      placeForest(portrait ? 0.3 * W : whisk.left + 0.215 * whisk.w - 0.07 * W);
      placeRefraction();
      let titleBottom = H * 0.35;
      try {
        titleBottom = buildTitle(portrait);
      } catch (err) {
        console.warn('Glass title unavailable:', err);
        setGlass(false);
      }
      // Upright, the words go above the log; on desktop the log keeps clear
      // of the buttons, so it is placed after them.
      const bowlsH = portrait ? placeBowls(true, whisk) : 0;
      placeCopy(portrait, titleBottom, whisk, bowlsH);
      if (!portrait) placeBowls(false, whisk);
      placeFoliage(portrait);
      wake();
    };

    // ---- animation

    const render = (now: number) => {
      raf = 0;
      if (!visible || cancelled) return;
      // Arrival, once the pictures are in: the forest is there from the
      // start; then the title, the log settling up onto the ground, the
      // whisk, the near foliage, and the words last.
      const t = reduced ? 10 : startTime < 0 ? 0 : (now - startTime) / 1000;
      const titleIn = span(t, 0.35, 1.9);
      const bowlsIn = easeOut(span(t, 0.5, 1.7));
      const whiskIn = easeOut(span(t, 0.8, 2.2));
      const foliageIn = easeOut(span(t, 1.0, 2.3));
      const copyIn = easeOut(span(t, 1.5, 2.3));

      // Damped pointer.
      eased.x += (pointer.x - eased.x) * 0.07;
      eased.y += (pointer.y - eased.y) * 0.07;
      // Scroll: only while the hero is leaving.
      const scroll = reduced ? 0 : Math.max(0, Math.min(window.scrollY, H));
      const drift = (depth: number) => `translate3d(${-eased.x * depth}px, ${-eased.y * depth}px, 0)`;
      const lift = (speed: number) => `translate3d(0, ${scroll * speed}px, 0)`;

      forestScrollRef.current!.style.transform = lift(SCROLL.forest);
      forestPointerRef.current!.style.transform = drift(DEPTH.forest);

      bowlsScrollRef.current!.style.transform = lift(SCROLL.bowls);
      bowlsPointerRef.current!.style.transform = drift(DEPTH.bowls);
      bowlsEnterRef.current!.style.opacity = String(bowlsIn);
      bowlsEnterRef.current!.style.transform = `translate3d(0, ${(1 - bowlsIn) * 20}px, 0)`;

      foliageScrollRef.current!.style.transform = lift(SCROLL.foliage);
      foliagePointerRef.current!.style.transform = drift(DEPTH.foliage);
      foliageEnterRef.current!.style.opacity = String(foliageIn);
      foliageEnterRef.current!.style.transform = `scale(${1 + 0.025 * (1 - foliageIn)})`;

      titleRef.current!.style.transform =
        `translate3d(${-eased.x * DEPTH.title}px, ${-eased.y * DEPTH.title + scroll * SCROLL.title}px, 0)`;
      for (const g of glyphs) {
        const r = charReveal(titleIn, g.fromCenter);
        const y = (1 - r) * (18 + g.fromCenter * 24);
        const x = (1 - r) * (g.fromCenter > 0.01 ? g.fromCenter * 16 * g.side : 0);
        g.el.setAttribute('opacity', r.toFixed(3));
        g.el.setAttribute('transform', r >= 1 ? '' : `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
      }

      const whisk = whiskRef.current!;
      whisk.style.opacity = String(whiskIn);
      whisk.style.transform =
        `translate3d(${-eased.x * DEPTH.whisk + (1 - whiskIn) * 26}px, ${-eased.y * DEPTH.whisk + (1 - whiskIn) * 60 + scroll * SCROLL.whisk}px, 0) ` +
        `rotate(${eased.x * DEPTH.whiskTurn + (1 - whiskIn) * 4}deg)`;

      copyRef.current!.style.opacity = String(copyIn);
      copyRef.current!.style.transform = `translate3d(0, ${(1 - copyIn) * 14}px, 0)`;

      const arriving = startTime < 0 || t < 2.4;
      const following = Math.abs(pointer.x - eased.x) > 0.001 || Math.abs(pointer.y - eased.y) > 0.001;
      if (arriving || following) wake();
    };

    function wake() {
      if (!raf && visible && !cancelled) raf = requestAnimationFrame(render);
    }

    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || portrait) return;
      const box = stage.getBoundingClientRect();
      pointer.x = clamp01((e.clientX - box.left) / box.width) * 2 - 1;
      pointer.y = clamp01((e.clientY - box.top) / box.height) * 2 - 1;
      wake();
    };
    const onLeave = () => {
      pointer.x = 0;
      pointer.y = 0;
      wake();
    };
    const onScroll = () => wake();

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
    });
    io.observe(section);
    const ro = new ResizeObserver(layout);
    ro.observe(stage);
    if (!reduced) {
      if (finePointer) {
        stage.addEventListener('pointermove', onPointer);
        stage.addEventListener('pointerleave', onLeave);
      }
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    // The sequence starts when the forest, log, whisk and foliage have
    // decoded, or after START_WAIT if they are slow.
    const begin = () => {
      if (cancelled || startTime >= 0) return;
      startTime = performance.now();
      wake();
    };
    const startTimer = window.setTimeout(begin, START_WAIT);
    const pictures = [forestImgRef.current, bowlsEnterRef.current?.querySelector('img'), whiskRef.current, ...leafRefs.current];
    Promise.all(pictures.map((img) => img?.decode().catch(() => undefined))).then(begin);

    // Laid out at once, and again in the title's own typeface once it is in:
    // after its stylesheet loads, and whenever the browser finishes loading
    // fonts (which also covers a stylesheet that was already there).
    layout();
    const fonts = document.fonts;
    const measureInFace = () => {
      fonts?.load('800 100px "Saira Extra Condensed"').catch(() => undefined).then(() => {
        if (!cancelled) layout();
      });
    };
    const onFontsLoaded = () => {
      if (!cancelled) layout();
    };
    fontLink.addEventListener('load', measureInFace);
    fonts?.addEventListener?.('loadingdone', onFontsLoaded);
    measureInFace();

    return () => {
      cancelled = true;
      window.clearTimeout(startTimer);
      fontLink?.removeEventListener('load', measureInFace);
      fonts?.removeEventListener?.('loadingdone', onFontsLoaded);
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      stage.removeEventListener('pointermove', onPointer);
      stage.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const scrollOn = () => {
    const section = sectionRef.current;
    if (!section) return;
    const header = document.querySelector('header')?.getBoundingClientRect().height ?? 0;
    window.scrollTo({ top: section.getBoundingClientRect().bottom + window.scrollY - header, behavior: 'smooth' });
  };

  return (
    <section
      ref={sectionRef}
      aria-labelledby="hero-title"
      className="relative isolate bg-black h-[100vh] supports-[height:100svh]:h-[100svh] min-h-[560px] pt-16 sm:pt-[4.5rem] lg:pt-[clamp(0.5rem,1.4vw,1.25rem)] px-[clamp(0.5rem,1.4vw,1.25rem)] pb-[clamp(0.5rem,1.4vw,1.25rem)]"
    >
      {/* The poster frame of the original, on the site's black. */}
      <div ref={stageRef} className="relative h-full w-full overflow-hidden rounded-xl bg-[#2c3a1b]">
        {/* 1. The forest clearing and the sauna far off: there from the start. */}
        <div ref={forestScrollRef} aria-hidden className="pointer-events-none absolute inset-0 will-change-transform">
          <div ref={forestPointerRef} className="absolute inset-0 will-change-transform">
            <img
              ref={forestImgRef}
              src={FOREST.src}
              srcSet={FOREST.srcSet}
              sizes={FOREST.sizes}
              alt=""
              decoding="async"
              {...{ fetchpriority: 'high' }}
              draggable={false}
              className="absolute -inset-[4%] h-[108%] w-[108%] max-w-none select-none object-cover"
            />
            {/* The original's film grain. */}
            <div
              className="absolute inset-0 opacity-[0.12] mix-blend-overlay"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")",
              }}
            />
          </div>
        </div>

        {/* The brand for assistive technology; the glass letters are decoration. */}
        <h1
          id="hero-title"
          className={
            glass
              ? 'sr-only'
              : 'absolute inset-x-0 top-[6%] z-20 text-center text-[clamp(3.5rem,13vw,12rem)] font-extrabold leading-none tracking-tight text-white/75 [text-shadow:0_2px_24px_rgba(0,0,0,0.35)]'
          }
        >
          {TITLE}
        </h1>

        <div ref={titleRef} aria-hidden className={`absolute inset-0 z-20 will-change-transform ${glass ? '' : 'hidden'}`}>
          <svg ref={svgRef} className="absolute inset-0 h-full w-full overflow-visible">
            <defs>
              <g id="hero-glyphs" ref={glyphsRef} />
              <mask id="hero-glyph-mask" maskUnits="userSpaceOnUse" x="-50%" y="-50%" width="200%" height="200%">
                <use href="#hero-glyphs" fill="white" />
              </mask>
              {/* The forest bent a little, as thick glass would. */}
              <filter id="hero-refract" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
                <feTurbulence type="fractalNoise" baseFrequency="0.006 0.012" numOctaves={2} seed={7} result="noise" />
                <feDisplacementMap id="hero-displace" in="SourceGraphic" in2="noise" scale={14} xChannelSelector="R" yChannelSelector="G" result="bent" />
                <feColorMatrix in="bent" type="matrix" values="1.06 0 0 0 0.05  0 1.06 0 0 0.06  0 0 1.06 0 0.06  0 0 0 1 0" />
              </filter>
              {/* Light gathered just inside each letter's edge. */}
              <filter id="hero-inner" x="-10%" y="-10%" width="120%" height="120%">
                <feGaussianBlur id="hero-inner-blur" in="SourceAlpha" stdDeviation={4} result="blur" />
                <feComposite in="SourceAlpha" in2="blur" operator="out" result="rim" />
                <feFlood floodColor="#ffffff" floodOpacity={0.5} />
                <feComposite in2="rim" operator="in" />
              </filter>
              {/* A soft shadow outside the letters, for contrast on bright leaves. */}
              <filter id="hero-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur id="hero-shadow-blur" in="SourceAlpha" stdDeviation={6} result="blur" />
                <feOffset in="blur" dy={4} result="moved" />
                <feFlood floodColor="#06120a" floodOpacity={0.32} />
                <feComposite in2="moved" operator="in" result="shadow" />
                <feComposite in="shadow" in2="SourceAlpha" operator="out" />
              </filter>
              <linearGradient id="hero-sheen" x1="0" y1="0" x2="0.25" y2="1">
                <stop offset="0" stopColor="#fff" stopOpacity={0.3} />
                <stop offset="0.42" stopColor="#fff" stopOpacity={0.04} />
                <stop offset="0.6" stopColor="#fff" stopOpacity={0} />
                <stop offset="1" stopColor="#fff" stopOpacity={0.1} />
              </linearGradient>
            </defs>

            <use href="#hero-glyphs" fill="#000" filter="url(#hero-shadow)" />
            <g mask="url(#hero-glyph-mask)">
              <image ref={refractRef} href={FOREST.small} preserveAspectRatio="none" filter="url(#hero-refract)" />
              <rect x="-50%" y="-50%" width="200%" height="200%" fill="#e9f5ea" opacity={0.12} />
              <rect x="0" y="0" width="100%" height="100%" fill="url(#hero-sheen)" />
            </g>
            <use href="#hero-glyphs" fill="#fff" filter="url(#hero-inner)" />
            <use href="#hero-glyphs" fill="none" stroke="rgba(255,255,255,0.62)" strokeWidth={1.1} />
          </svg>
        </div>

        {/* 3. The log with the bowls, one picture, settling onto the ground. */}
        <div ref={bowlsScrollRef} aria-hidden className="pointer-events-none absolute inset-0 z-[25] will-change-transform">
          <div ref={bowlsPointerRef} className="absolute inset-0 will-change-transform">
            <div ref={bowlsBoxRef} className="absolute">
              <div ref={bowlsEnterRef} className="h-full w-full opacity-0 will-change-transform">
                <img
                  src={BOWLS.src}
                  srcSet={BOWLS.srcSet}
                  sizes={BOWLS.sizes}
                  width={BOWLS.w}
                  height={BOWLS.h}
                  alt=""
                  decoding="async"
                  {...{ fetchpriority: 'high' }}
                  draggable={false}
                  className="block h-full w-full select-none"
                  style={{ filter: 'brightness(0.94) saturate(0.94) drop-shadow(0 -6px 18px rgba(20,24,8,0.25))' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4. The hand with the whisk, unchanged. */}
        <img
          ref={whiskRef}
          src={WHISK.src}
          srcSet={`${WHISK.small} 960w, ${WHISK.src} 1672w`}
          sizes="(orientation: portrait) 160vw, 100vw"
          alt=""
          aria-hidden
          decoding="async"
          draggable={false}
          className="pointer-events-none absolute z-30 max-w-none select-none opacity-0 will-change-transform"
          style={{ filter: 'drop-shadow(0 18px 30px rgba(6,18,10,0.28))' }}
        />

        {/* 5. Birch leaves and ferns nearest the camera, at the corners. */}
        <div ref={foliageScrollRef} aria-hidden className="pointer-events-none absolute inset-0 z-[35] will-change-transform">
          <div ref={foliagePointerRef} className="absolute inset-0 will-change-transform">
            <div ref={foliageEnterRef} className="absolute inset-0 opacity-0 will-change-transform">
              {LEAVES.map((leaf, i) => (
                <img
                  key={leaf.name}
                  ref={(el) => {
                    leafRefs.current[i] = el;
                  }}
                  src={`/media/hero/${leaf.name}-${leaf.w}.webp`}
                  srcSet={leafSrcSet(leaf)}
                  sizes="30vw"
                  width={leaf.w}
                  height={leaf.h}
                  alt=""
                  decoding="async"
                  draggable={false}
                  className="absolute max-w-none select-none"
                  style={{ filter: 'brightness(0.9) saturate(0.95)' }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* The words and buttons: in the open forest under the title on
            desktop, at the foot on upright screens (placed by placeCopy). */}
        <div
          ref={copyRef}
          className="absolute inset-x-0 bottom-0 z-40 opacity-0 px-5 pb-16 sm:px-8 sm:pb-12"
        >
          {/* A soft shade behind the words only, for contrast on bright leaves. */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-8 -inset-y-10"
            style={{ background: 'radial-gradient(60% 65% at 28% 50%, rgba(4,14,7,0.5), transparent 75%)' }}
          />
          {/* Upright screens: the words sit over the sauna and the whisk, so a
              deeper, wider shade under them. */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-8 -top-20 bottom-6 hidden portrait:block"
            style={{ background: 'radial-gradient(95% 70% at 40% 42%, rgba(4,12,7,0.62), rgba(4,12,7,0.3) 62%, transparent 100%)' }}
          />
          <div className="relative">
            <p
              className="hero-glass-text text-[clamp(2.4rem,5.2vw,5.25rem)] font-extrabold leading-[0.98] tracking-[-0.01em] portrait:![filter:drop-shadow(0_2px_12px_rgba(0,0,0,0.7))_drop-shadow(0_0_1px_rgba(255,255,255,0.35))]"
              style={{ fontFamily: TITLE_FONT, ['--glass-src' as string]: `url(${FOREST.small})` }}
            >
              {t('poster.tagline')}
            </p>
            <div ref={buttonsRef} className="mt-7 sm:mt-9 flex flex-wrap gap-3 sm:gap-4">
              <Link
                to="/pirts-rituali"
                className="inline-flex items-center rounded-full bg-green-600 px-7 py-4 sm:px-9 sm:py-5 text-lg sm:text-xl font-semibold text-white shadow-[0_12px_32px_-12px_rgba(34,197,94,0.8),inset_0_1px_0_rgba(255,255,255,0.35)] transition-colors hover:bg-green-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-green-300/60"
              >
                {t('poster.primary')}
              </Link>
              {/* One section down, to the services, as the arrow below does. */}
              <a
                href="#pakalpojumi"
                onClick={(event) => {
                  event.preventDefault();
                  scrollOn();
                }}
                className="inline-flex items-center rounded-full border border-white/45 bg-white/10 px-7 py-4 sm:px-9 sm:py-5 text-lg sm:text-xl font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-md transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/50"
              >
                {t('poster.secondary')}
              </a>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={scrollOn}
          aria-label={t('poster.scroll')}
          className="absolute bottom-3 left-1/2 z-40 -translate-x-1/2 rounded-full p-2 text-white/70 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <ChevronDown className="h-6 w-6" />
        </button>
      </div>
    </section>
  );
};

export default WhiskPosterHero;
