import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useScroll, useSpring, useTransform, type MotionValue } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { eyebrow, nomaPhoto, nomaSrcSet } from './glass';

// The place around the saunas: on wide screens the band pins under the
// navigation and the page's scroll carries the photos sideways past it (the
// "horizontal scroll carousel" from 21st.dev), each photo drifting a little
// inside its frame. A thin glass bar shows how far along it is. Phones and
// reduced motion get an ordinary row that scrolls sideways by touch.

const PHOTOS: { n: string; wide?: boolean }[] = [
  { n: '38', wide: true },
  { n: '16' },
  { n: '40', wide: true },
  { n: '21' },
  { n: 'place-woodshed', wide: true },
];

const PIN = '(min-width: 1024px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)';

const usePinned = () => {
  const [pinned, setPinned] = useState(() => window.matchMedia(PIN).matches);
  useEffect(() => {
    const q = window.matchMedia(PIN);
    const on = () => setPinned(q.matches);
    q.addEventListener('change', on);
    return () => q.removeEventListener('change', on);
  }, []);
  return pinned;
};

const Frame: React.FC<{ n: string; wide?: boolean; alt: string; progress: MotionValue<number>; drift: boolean; index: number }> = ({
  n,
  wide,
  alt,
  progress,
  drift,
  index,
}) => {
  // The photo moves against the band a little, so it seems to sit deeper.
  const x = useTransform(progress, [0, 1], [-30 + index * 4, 30 - index * 4]);
  return (
    <figure
      className={`relative shrink-0 snap-center overflow-hidden rounded-[2rem] bg-neutral-900 ring-1 ring-white/15 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)] ${
        wide ? 'h-[62svh] w-[min(46vw,640px)] max-lg:h-72 max-lg:w-[82vw]' : 'h-[50svh] w-[min(30vw,420px)] max-lg:h-72 max-lg:w-[64vw] lg:self-end'
      }`}
    >
      <motion.img
        src={nomaPhoto(n)}
        srcSet={nomaSrcSet(n)}
        sizes="(min-width: 1024px) 46vw, 82vw"
        alt={alt}
        loading="lazy"
        decoding="async"
        draggable={false}
        style={drift ? { x, scale: 1.12 } : undefined}
        className="h-full w-full select-none object-cover"
      />
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[2rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]" />
    </figure>
  );
};

const PlaceScroll = () => {
  const { t } = useTranslation('noma');
  const pinned = usePinned();
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [travel, setTravel] = useState(0);

  // How far the track has to move: its width past the window's.
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track || !pinned) return;
    const measure = () => setTravel(Math.max(0, track.scrollWidth - window.innerWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [pinned]);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });
  // The heading holds a moment before the photos start to move, and the
  // last photo a moment at the end.
  const x = useTransform(progress, [0.1, 0.92], [0, -travel]);
  const still = useMotionValue(0);

  const intro = (
    <div className="flex w-[min(34vw,460px)] shrink-0 flex-col justify-center pr-4 max-lg:w-full max-lg:px-4 max-lg:pb-8">
      <p className={eyebrow}>{t('page.placeEyebrow')}</p>
      <h2 id="place-heading" className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-6xl">
        {t('page.placeTitle')}
      </h2>
      <p className="mt-5 text-base leading-relaxed text-white/70 sm:text-lg">{t('page.placeText')}</p>
    </div>
  );
  const alt = t('page.placeTitle');

  if (!pinned) {
    return (
      <section ref={sectionRef} aria-labelledby="place-heading" className="relative py-16 sm:py-20">
        <div className="mx-auto max-w-7xl">{intro}</div>
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-6">
          {PHOTOS.map((p, i) => (
            <Frame key={p.n} n={p.n} wide={p.wide} alt={alt} progress={still} drift={false} index={i} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} aria-labelledby="place-heading" className="relative" style={{ height: `calc(100svh + ${travel}px)` }}>
      <div className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden">
        <motion.div ref={trackRef} style={{ x }} className="flex w-max items-center gap-6 pl-[max(2rem,calc((100vw-80rem)/2+2rem))] pr-[8vw] will-change-transform">
          {intro}
          {PHOTOS.map((p, i) => (
            <Frame key={p.n} n={p.n} wide={p.wide} alt={alt} progress={progress} drift index={i} />
          ))}
        </motion.div>
        {/* How far along: a thin glass bar. */}
        <div className="mx-auto mt-10 h-1 w-48 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/10">
          <motion.div className="h-full origin-left rounded-full bg-green-400" style={{ scaleX: progress }} />
        </div>
      </div>
    </section>
  );
};

export default PlaceScroll;
