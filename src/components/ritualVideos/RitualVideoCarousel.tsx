import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { Pause, Play } from 'lucide-react';

// A coverflow of upright (9:16) videos in glass frames: the chosen one in
// front, one either side turned away, the rest waiting off stage.
//
// Adapted from 21st.dev's "Glassy Coverflow Carousel" (troyjlorents-gh): the
// same coverflow geometry (spacing, turn and depth per step), virtual slots
// that recycle off stage so the deck wraps without cards crossing through it,
// swipe that only takes over for sideways drags, and arrow / Home / End keys.
// Changed for the sauna: the cards are glass frames around video, each with
// its own play button. Pressing a card at the side glides it to the front and
// plays it once it has arrived; pressing the front card plays or pauses it.
// Nothing plays by itself, and a video stops when the section leaves the
// screen. The videos play with their sound: only ever on a press, and the
// press itself starts the video (see `unlock`), so browsers allow it.

export interface RitualVideo {
  id: string;
  // For screen readers (the play and pause labels); the cards show no caption.
  title: string;
  // The clip; until there is one, the poster stands in.
  src?: string;
  poster: string;
}

export interface RitualVideoLabels {
  region: string;
  play: (title: string) => string;
  pause: (title: string) => string;
  soon: string;
}

interface Props {
  items: RitualVideo[];
  labels: RitualVideoLabels;
  initialIndex?: number;
  // In a narrow column: size the cards so all three stay inside it.
  fit?: boolean;
}

const wrap = (value: number, length: number) => ((value % length) + length) % length;
// How long a card takes to glide to the front (the transform transition).
const GLIDE_MS = 700;

export default function RitualVideoCarousel({ items, labels, initialIndex = 0, fit = false }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [stageWidth, setStageWidth] = useState(1100);
  const [onScreen, setOnScreen] = useState(false);
  const [reduced, setReduced] = useState(false);
  // Whether the front video should play: set by pressing a card.
  const [playing, setPlaying] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const videos = useRef(new Map<number, HTMLVideoElement>());
  const gesture = useRef<{ x: number; y: number; time: number; horizontal: boolean } | null>(null);
  const suppressClickUntil = useRef(0);
  // When the front card last changed, so a pressed card plays once it lands.
  const arrivedAt = useRef(0);

  const count = items.length;
  const activeIndex = count ? wrap(index, count) : 0;
  const active = items[activeIndex];
  // Three in view: the front card and one on each side.
  const fitted = fit && stageWidth >= 480;
  const cardWidth = Math.round(
    fitted
      ? Math.min(300, stageWidth / 2.5)
      : Math.min(330, Math.max(200, stageWidth * (stageWidth < 640 ? 0.6 : 0.26)))
  );
  // Wide screens show all three videos whole; phones and narrow columns tuck
  // the sides behind.
  const step = cardWidth * (fitted || stageWidth < 640 ? 0.72 : 1.04);
  const before = Math.min(1, Math.floor((count - 1) / 2));
  const after = Math.min(1, Math.ceil((count - 1) / 2));
  const slots = count > 1 ? Array.from({ length: before + after + 3 }, (_, p) => index + p - before - 1) : [index];

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const measure = () => setStageWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  // Only the front video plays: after it has glided into place, and only
  // while the section is on screen. Every other video is paused.
  useEffect(() => {
    const wait = reduced ? 0 : Math.max(0, GLIDE_MS - (performance.now() - arrivedAt.current));
    const timer = window.setTimeout(() => {
      videos.current.forEach((video, slot) => {
        if (slot === index && playing && onScreen) video.play().catch(() => setPlaying(false));
        else video.pause();
      });
    }, playing ? wait : 0);
    return () => window.clearTimeout(timer);
  }, [index, playing, onScreen, reduced]);

  // Browsing by swipe or keys shows a card without starting it.
  const browse = (next: number) => {
    arrivedAt.current = performance.now();
    setIndex(next);
    setDrag(0);
    setPlaying(false);
  };
  // Browsers only let a video play with sound from within a press, and a
  // card at the side starts only once it has glided to the front: so the
  // press starts it at once, and (for a side card) pauses it again until it
  // has arrived. After that the video may start later on its own.
  const unlock = (slot: number, holdUntilArrived: boolean) => {
    const video = videos.current.get(slot);
    if (!video) return;
    // Only one sound at a time: the one playing stops at the press.
    videos.current.forEach((other, s) => s !== slot && other.pause());
    video.muted = false;
    video
      .play()
      .then(() => {
        if (holdUntilArrived && performance.now() - arrivedAt.current < GLIDE_MS - 50) video.pause();
      })
      .catch(() => undefined);
  };

  // Pressing a card at the side brings it to the front and plays it.
  const playCard = (next: number) => {
    arrivedAt.current = performance.now();
    setIndex(next);
    setDrag(0);
    setPlaying(true);
  };

  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    gesture.current = { x: event.clientX, y: event.clientY, time: performance.now(), horizontal: false };
  };
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = gesture.current;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    // An upward or downward swipe is the page scrolling: let it go.
    if (!start.horizontal && Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) {
      gesture.current = null;
      return;
    }
    if (!start.horizontal && Math.abs(dx) > 8) {
      start.horizontal = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(true);
    }
    if (start.horizontal) setDrag(Math.max(-1.2, Math.min(1.2, dx / step)));
  };
  const pointerUp = (event: PointerEvent<HTMLDivElement>, cancel = false) => {
    const start = gesture.current;
    gesture.current = null;
    if (start?.horizontal) {
      const dx = event.clientX - start.x;
      const velocity = Math.abs(dx) / Math.max(1, performance.now() - start.time);
      if (!cancel && (Math.abs(dx) > Math.min(55, cardWidth * 0.18) || (Math.abs(dx) > 14 && velocity > 0.35))) {
        browse(index + (dx < 0 ? 1 : -1));
      } else {
        setDrag(0);
      }
      suppressClickUntil.current = performance.now() + 300;
    } else {
      setDrag(0);
    }
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  if (!active) return null;
  const cardHeight = (cardWidth * 16) / 9;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={labels.region}
      onKeyDown={(event) => {
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        if (event.key === 'ArrowRight') { event.preventDefault(); browse(index + 1); }
        if (event.key === 'ArrowLeft') { event.preventDefault(); browse(index - 1); }
        if (event.key === 'Home') { event.preventDefault(); browse(index - activeIndex); }
        if (event.key === 'End') { event.preventDefault(); browse(index - activeIndex + count - 1); }
      }}
      // Swipes are read here, outside the 3D stage: the cards at the sides
      // sit behind the stage's own plane, so the stage must not catch
      // pointers, or a press on those cards would never reach them.
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={(event) => pointerUp(event)}
      onPointerCancel={(event) => pointerUp(event, true)}
      className={`select-none ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{ touchAction: 'pan-y' }}
    >
      <div
        ref={stage}
        className="pointer-events-none relative flex items-center justify-center"
        style={{ height: cardHeight + 48, perspective: 1200, transformStyle: 'preserve-3d' }}
      >
        {/* A soft green light on the floor under the deck. */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-1/2 h-10 w-[min(640px,85%)] -translate-x-1/2 blur-2xl"
          style={{ background: 'radial-gradient(ellipse, rgba(34,197,94,0.35), transparent 70%)' }}
        />

        {slots.map((slot) => {
          const item = items[wrap(slot, count)];
          const d = slot - index;
          const offset = d + drag;
          const abs = Math.abs(offset);
          const offstage = d < -before || d > after;
          const front = slot === index;
          const isPlaying = front && playing && !!item.src;
          return (
            <button
              key={slot}
              type="button"
              tabIndex={offstage ? -1 : 0}
              aria-hidden={offstage || undefined}
              aria-current={front ? 'true' : undefined}
              aria-label={isPlaying ? labels.pause(item.title) : labels.play(item.title)}
              onClick={() => {
                if (performance.now() < suppressClickUntil.current) return;
                if (front) {
                  if (!playing) unlock(slot, false);
                  setPlaying((p) => !p);
                } else {
                  playCard(index + d);
                  unlock(slot, !reduced);
                }
              }}
              className={`group absolute rounded-[2rem] p-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-green-300 ${
                dragging || reduced ? '' : 'transition-[transform,opacity] duration-700 ease-[cubic-bezier(.22,1,.36,1)]'
              }`}
              style={
                {
                  width: cardWidth,
                  transform: `translate3d(${offset * step}px, 0, ${-Math.min(abs, 3) * 140}px) rotateY(${-Math.max(-40, Math.min(40, offset * 28))}deg) scale(${1 - Math.min(abs, 3) * 0.08})`,
                  opacity: offstage ? 0 : 1,
                  zIndex: 10 - Math.abs(d),
                  pointerEvents: offstage ? 'none' : 'auto',
                  backfaceVisibility: 'hidden',
                  // The glass frame: frosted, a bright rim on top, a deep soft shadow.
                  background: 'linear-gradient(160deg, rgba(255,255,255,0.22), rgba(255,255,255,0.06) 45%, rgba(255,255,255,0.12))',
                  boxShadow:
                    'inset 0 1px 0 rgba(255,255,255,0.55), inset 0 0 0 1px rgba(255,255,255,0.22), 0 40px 80px -30px rgba(0,0,0,0.85), 0 0 60px -20px rgba(34,197,94,0.35)',
                  backdropFilter: 'blur(18px) saturate(150%)',
                  WebkitBackdropFilter: 'blur(18px) saturate(150%)',
                } as CSSProperties
              }
            >
              <span className="relative block overflow-hidden rounded-[1.5rem] bg-neutral-900" style={{ aspectRatio: '9 / 16' }}>
                {item.src ? (
                  <video
                    ref={(el) => {
                      if (el) videos.current.set(slot, el);
                      else videos.current.delete(slot);
                    }}
                    className="absolute inset-0 h-full w-full object-cover"
                    poster={item.poster}
                    loop
                    playsInline
                    preload={Math.abs(d) <= 1 ? 'metadata' : 'none'}
                  >
                    <source src={item.src} type="video/mp4" />
                  </video>
                ) : (
                  <img src={item.poster} alt="" draggable={false} loading={Math.abs(d) <= 1 ? 'eager' : 'lazy'} className="absolute inset-0 h-full w-full object-cover" />
                )}
                {/* The cards behind darken a little with depth. */}
                <span
                  aria-hidden
                  className={`absolute inset-0 bg-black ${dragging || reduced ? '' : 'transition-opacity duration-500'}`}
                  style={{ opacity: Math.min(abs, 2) * 0.22 }}
                />
                {/* A glass sheen across the top of the picture. */}
                <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/15 to-transparent" />

                {/* The play button: glass, in the middle of the picture. While
                    the front video plays it fades away, and shows a pause
                    sign on hover. */}
                <span
                  aria-hidden
                  className={`absolute left-1/2 top-[44%] flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-white ring-1 ring-white/40 backdrop-blur-xl transition-[opacity,transform] duration-500 group-hover:scale-110 ${
                    front ? 'h-20 w-20' : 'h-14 w-14'
                  } ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}
                  style={{
                    background: 'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.35), rgba(255,255,255,0.1) 60%)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), 0 12px 30px -10px rgba(0,0,0,0.6), 0 0 40px -10px rgba(34,197,94,0.6)',
                  }}
                >
                  {isPlaying ? (
                    <Pause className={front ? 'h-8 w-8' : 'h-6 w-6'} fill="currentColor" strokeWidth={0} />
                  ) : (
                    <Play className={`${front ? 'h-8 w-8' : 'h-6 w-6'} translate-x-0.5`} fill="currentColor" strokeWidth={0} />
                  )}
                </span>

                {front && !item.src && (
                  <span className="absolute left-3 top-3 rounded-full bg-black/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white ring-1 ring-white/25 backdrop-blur-xl">
                    {labels.soon}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
