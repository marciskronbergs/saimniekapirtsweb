import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';

// Glowing leaves drifting behind a run of homepage sections: oak, birch,
// pine and spruce, cut from one sheet (public/media/leaves/).
//
// Each leaf has a depth. Near ones are larger, sharper and brighter and
// follow the pointer further; far ones are small, soft and dim. On top of
// that every leaf drifts and sways slowly on its own, moves a little against
// the scroll, and fades in the first time it comes into view. Like the hero,
// all of it runs in one requestAnimationFrame loop that writes transforms
// straight onto the leaves, only while the sections are on screen.

type LeafKind = 'oak-1' | 'oak-2' | 'birch-1' | 'birch-2' | 'pine' | 'spruce-1' | 'spruce-2';
const KINDS: LeafKind[] = ['oak-1', 'birch-1', 'pine', 'spruce-2', 'birch-2', 'oak-2', 'spruce-1'];

interface Leaf {
  kind: LeafKind;
  // From the backdrop's top, in px.
  top: number;
  // From its side, in % of the width (negative: partly past the edge).
  left?: number;
  right?: number;
  width: number;
  depth: number;
  rotate: number;
  flip?: boolean;
  wideOnly?: boolean;
}

// A spot kept free of leaves, where a hand with a whisk (WhiskAccent) comes
// in: a side, and how far down the backdrop (in % of its height).
export interface LeafClearing {
  side: 'left' | 'right';
  top: number;
}

// How far the nearest leaf follows the pointer, in pixels.
const POINTER_REACH = 52;

// The scatter, laid out down the backdrop's whole height at an even pace so
// no stretch is bare and none crowded, whatever the page: a leaf at each edge
// in turn every EDGE_STEP px (left, right, left...), starting in the top
// corners, and between them, further in and further away, a smaller, softer
// one every INNER_STEP px (wide screens only). Every size, turn, kind and
// small offset comes from a fixed pseudo-random sequence, so a page looks the
// same on every visit. Positions are in px from the top, so when the backdrop
// grows (a booking opens) the leaves above stay where they are and new ones
// are only added below.
const EDGE_STEP = 250;
const INNER_STEP = 620;
// Room (px) a leaf keeps above the backdrop's foot for its drift and sway.
const FOOT_ROOM = 80;
// Keep this far (px) from a clearing.
const CLEAR_REACH = 260;

const rand = (i: number, salt: number) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const layLeaves = (height: number, clear: LeafClearing[]): Leaf[] => {
  const leaves: Leaf[] = [];
  const kept = (side: 'left' | 'right', top: number) =>
    !clear.some((c) => c.side === side && Math.abs((c.top / 100) * height - top) < CLEAR_REACH);
  let lastKind = -1;
  const kindAt = (i: number, salt: number) => {
    let k = Math.floor(rand(i, salt) * KINDS.length);
    if (k === lastKind) k = (k + 1) % KINDS.length;
    lastKind = k;
    return KINDS[k];
  };

  // The edges.
  for (let i = 0; ; i++) {
    const top = i === 0 ? -30 : i * EDGE_STEP + (rand(i, 1) - 0.5) * 90;
    if (top > height - 90) break;
    const side = i % 2 === 0 ? 'left' : 'right';
    if (!kept(side, top)) continue;
    const depth = 0.55 + rand(i, 2) * 0.55;
    const offset = -14 + rand(i, 3) * 14;
    const width = Math.round(220 + depth * 200 + rand(i, 5) * 40);
    // Whole or not at all: a leaf the backdrop's foot would cut in half
    // (with room for its drift) is left out.
    if (top + width + FOOT_ROOM > height) continue;
    leaves.push({
      kind: kindAt(i, 4),
      top,
      [side]: offset,
      width,
      depth,
      rotate: Math.round((rand(i, 6) - 0.5) * 90 + (side === 'left' ? 14 : -14)),
      flip: rand(i, 7) > 0.5,
    });
  }

  // Further in, between the edge leaves.
  for (let j = 0; ; j++) {
    const top = INNER_STEP * 0.45 + j * INNER_STEP + (rand(j, 11) - 0.5) * 120;
    if (top > height - 120) break;
    const side = j % 2 === 0 ? 'right' : 'left';
    const depth = 0.28 + rand(j, 12) * 0.14;
    const width = Math.round(240 + rand(j, 15) * 140);
    if (top + width + FOOT_ROOM > height) continue;
    leaves.push({
      kind: kindAt(j, 13),
      top,
      [side]: 16 + rand(j, 14) * 20,
      width,
      depth,
      rotate: Math.round((rand(j, 16) - 0.5) * 120),
      flip: rand(j, 17) > 0.5,
      wideOnly: true,
    });
  }
  return leaves;
};

const LeafBackdrop = ({
  children,
  className = '',
  clear = [],
}: {
  children: ReactNode;
  className?: string;
  clear?: LeafClearing[];
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const leafRefs = useRef<(HTMLImageElement | null)[]>([]);
  // The backdrop's height, measured before the first paint and again when it
  // changes by more than a step (images arriving, a booking opening).
  const [height, setHeight] = useState<number | null>(null);
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    setHeight(root.offsetHeight);
    const ro = new ResizeObserver(() => {
      const h = root.offsetHeight;
      setHeight((prev) => (prev !== null && Math.abs(prev - h) < EDGE_STEP / 2 ? prev : h));
    });
    ro.observe(root);
    return () => ro.disconnect();
  }, []);
  const clearKey = JSON.stringify(clear);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const leaves = useMemo(() => (height === null ? [] : layLeaves(height, clear)), [height, clearKey]);

  useEffect(() => {
    if (!leaves.length) return;
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const wrappers = Array.from(root.querySelectorAll<HTMLElement>('[data-leaf]'));

    // Each leaf fades in the first time it comes near the viewport.
    const reveal = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-in', '');
            reveal.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px' }
    );
    wrappers.forEach((w) => reveal.observe(w));
    if (reduced) {
      wrappers.forEach((w) => w.setAttribute('data-in', ''));
      return () => reveal.disconnect();
    }

    const pointer = { x: 0, y: 0 };
    const eased = { x: 0, y: 0 };
    const phases = leaves.map((_, i) => i * 1.7);
    let raf = 0;
    let visible = false;

    const render = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      const t = now / 1000;
      eased.x += (pointer.x - eased.x) * 0.06;
      eased.y += (pointer.y - eased.y) * 0.06;
      const rect = root.getBoundingClientRect();
      const vh = window.innerHeight;
      leaves.forEach((leaf, i) => {
        const el = leafRefs.current[i];
        if (!el) return;
        const d = leaf.depth;
        const ph = phases[i];
        // Where the leaf sits against the middle of the screen, for the
        // scroll parallax: near leaves slide further.
        const centre = rect.top + leaf.top - vh / 2;
        const x = -eased.x * POINTER_REACH * d + Math.sin(t * 0.32 + ph) * 22 * (0.5 + 0.5 * d);
        const y = -eased.y * POINTER_REACH * d + Math.cos(t * 0.26 + ph) * 26 * (0.5 + 0.5 * d) - centre * 0.09 * d;
        const r = Math.sin(t * 0.29 + ph) * 6 + eased.x * 6 * d;
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${r.toFixed(2)}deg)`;
      });
      raf = requestAnimationFrame(render);
    };
    const start = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(render);
    };

    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const onVisibility = () => start();
    const onScreen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    });
    onScreen.observe(root);
    window.addEventListener('pointermove', onPointer, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      reveal.disconnect();
      onScreen.disconnect();
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [leaves]);

  // overflow-clip, not -hidden: it trims the leaves the same way but is no
  // scroll box, so sections inside it can still pin (position: sticky).
  return (
    <div ref={rootRef} className={`relative isolate overflow-clip bg-black max-md:[--leaf-dim:0.6] ${className}`}>
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        {leaves.map((leaf, i) => {
          // Far leaves: dimmer and a little out of focus, like depth of field.
          const blur = leaf.depth < 0.5 ? 2.5 : leaf.depth < 0.7 ? 1 : 0;
          const opacity = 0.28 + leaf.depth * 0.42;
          return (
            <div
              key={`${i}-${Math.round(leaf.top)}`}
              data-leaf
              className={`absolute opacity-0 scale-90 transition-[opacity,transform] duration-[1600ms] ease-out data-[in]:scale-100 data-[in]:opacity-[calc(var(--leaf-opacity)*var(--leaf-dim,1))] motion-reduce:transition-none ${
                leaf.wideOnly ? 'hidden md:block' : ''
              }`}
              style={{
                top: `${Math.round(leaf.top)}px`,
                left: leaf.left !== undefined ? `${leaf.left}%` : undefined,
                right: leaf.right !== undefined ? `${leaf.right}%` : undefined,
                width: `clamp(${Math.round(leaf.width * 0.6)}px, ${(leaf.width / 14.4).toFixed(2)}vw, ${leaf.width}px)`,
                transitionDelay: `${(i % 3) * 140}ms`,
                ['--leaf-opacity' as string]: opacity,
              }}
            >
              <img
                ref={(el) => (leafRefs.current[i] = el)}
                src={`/media/leaves/${leaf.kind}.webp`}
                alt=""
                loading="lazy"
                decoding="async"
                draggable={false}
                className="block h-auto w-full will-change-transform"
                style={{
                  rotate: `${leaf.rotate}deg`,
                  scale: leaf.flip ? '-1 1' : undefined,
                  filter: `${blur ? `blur(${blur}px) ` : ''}drop-shadow(0 0 ${Math.round(6 + leaf.depth * 10)}px rgba(34,197,94,${(0.18 + leaf.depth * 0.2).toFixed(2)}))`,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default LeafBackdrop;
