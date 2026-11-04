import { useEffect, useRef, useState } from 'react';
import { useReducedMotion, useInView } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { LucideIcon } from 'lucide-react';
import { Reveal } from '../pirtsRituali/ritualUi';
import { glass } from '../pirtsRituali/ritualStyles';

// One place to stay, as a glass block: its photos fill one side of the block
// to the edge and fade into the glass towards the words; they take turns,
// each drifting slowly closer while it shows, and the thumbnails pick one.
// The turns pause off screen and with reduced motion. `flip` puts the photos
// on the left.

export interface Perk {
  label: string;
  Icon: LucideIcon;
}

const stayPhoto = (n: string, size: 560 | 960) => `/media/noma/stay-${n}-${size}.webp`;
const TURN_MS = 5000;

const StayRoom: React.FC<{
  title: string;
  description: string;
  photos: string[];
  perks: Perk[];
  index: number;
  flip?: boolean;
}> = ({ title, description, photos, perks, index, flip }) => {
  const { t } = useTranslation('accommodation');
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const onScreen = useInView(ref, { amount: 0.25 });
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (reduced || !onScreen) return;
    const timer = window.setInterval(() => setCurrent((c) => (c + 1) % photos.length), TURN_MS);
    return () => window.clearInterval(timer);
  }, [reduced, onScreen, current, photos.length]);

  return (
    <Reveal y={40}>
      <article
        ref={ref}
        aria-labelledby={`stay-${index}`}
        className={`relative grid overflow-hidden rounded-[2.25rem] lg:min-h-[34rem] lg:grid-cols-2 ${glass}`}
      >
        {/* The photos, fading into the glass. */}
        <div className={`sr-photos relative h-80 sm:h-[26rem] lg:h-auto ${flip ? 'sr-left' : 'sr-right lg:order-2'}`}>
          {photos.map((n, i) => (
            <img
              key={n}
              src={stayPhoto(n, 960)}
              srcSet={`${stayPhoto(n, 560)} 560w, ${stayPhoto(n, 960)} 960w`}
              sizes="(min-width: 1024px) 50vw, 92vw"
              alt={i === current ? `${title} – ${i + 1}` : ''}
              aria-hidden={i !== current || undefined}
              loading="lazy"
              decoding="async"
              draggable={false}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1400ms] ease-in-out ${
                i === current ? `opacity-100 ${reduced ? '' : 'sr-drift'}` : 'opacity-0'
              }`}
            />
          ))}
        </div>

        {/* The words. */}
        {/* min-w-0: the row of thumbnails below must not widen the column past the card. */}
        <div className={`relative flex min-w-0 flex-col justify-center p-7 sm:p-10 lg:p-14 ${flip ? '' : 'lg:order-1'}`}>
          <div aria-hidden className="pointer-events-none absolute -top-24 h-72 w-72 rounded-full bg-green-500/15 blur-3xl" />
          <span className="relative text-xs font-semibold tabular-nums uppercase tracking-[0.25em] text-green-300">
            {String(index + 1).padStart(2, '0')}
          </span>
          <h3 id={`stay-${index}`} className="relative mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            {title}
          </h3>
          <p className="relative mt-4 max-w-md text-base leading-relaxed text-white/75 sm:text-lg">{description}</p>
          <ul className="relative mt-7 flex flex-wrap gap-2">
            {perks.map(({ label, Icon }) => (
              <li key={label} className="flex items-center gap-2 rounded-full bg-white/[0.07] px-4 py-2 text-sm text-white/90 ring-1 ring-white/15">
                <Icon aria-hidden className="h-4 w-4 text-green-300" />
                {label}
              </li>
            ))}
          </ul>
          {/* Thumbnails. */}
          <div className="relative mt-8 flex gap-2">
            {photos.map((n, i) => (
              <button
                key={n}
                type="button"
                onClick={() => setCurrent(i)}
                aria-label={t('ui.photo', { n: i + 1 })}
                aria-pressed={i === current}
                className={`h-14 w-16 overflow-hidden rounded-xl transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-300 sm:h-16 sm:w-20 ${
                  i === current ? 'ring-2 ring-green-400' : 'opacity-50 hover:opacity-100'
                }`}
              >
                <img src={stayPhoto(n, 560)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </article>
      <style>{`
        /* Phones: the photos on top, fading down into the words. */
        .sr-photos {
          -webkit-mask-image: linear-gradient(180deg, #000 0%, #000 55%, transparent 100%);
          mask-image: linear-gradient(180deg, #000 0%, #000 55%, transparent 100%);
        }
        @media (min-width: 1024px) {
          .sr-right {
            -webkit-mask-image: linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.55) 18%, #000 42%);
            mask-image: linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.55) 18%, #000 42%);
          }
          .sr-left {
            -webkit-mask-image: linear-gradient(270deg, transparent 0%, rgba(0, 0, 0, 0.55) 18%, #000 42%);
            mask-image: linear-gradient(270deg, transparent 0%, rgba(0, 0, 0, 0.55) 18%, #000 42%);
          }
        }
        .sr-drift { animation: sr-drift ${TURN_MS + 1400}ms linear both; }
        @keyframes sr-drift { from { transform: scale(1); } to { transform: scale(1.08); } }
      `}</style>
    </Reveal>
  );
};

export default StayRoom;
