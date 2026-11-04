import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Check, ChevronLeft, ChevronRight, Droplets, Flame, Home, type LucideIcon } from 'lucide-react';
import { firstRental } from '../popup/rentalChoice';
import { eyebrow, glassChip, glassPanel, nomaPhoto, nomaSrcSet, openRentalBooking, primaryButton, rise, useShown } from './glass';

// The two saunas and the herbal tub as large glass cards that stack as the
// page scrolls (the "stacking cards" pattern from 21st.dev): each card holds
// still under the navigation while the next one slides up over it, and the
// ones underneath shrink back and darken a little. Each card has its own
// photo viewer: a large photo crossfading, glass arrows and thumbnails.
//
// Wide screens only stack; on phones and tablets (where a card is taller
// than the screen) they follow each other in normal flow.

interface Card {
  key: string;
  icon: LucideIcon;
  photos: string[];
  title: string;
  description: string;
  checklist: string[];
}

const STACK = '(min-width: 1024px) and (min-height: 640px)';

// What each card's "book" button opens the form with: its sauna, or for the
// tub the first rental with it.
const BOOKS: Record<string, string> = {
  balta: 'Baltā pirts',
  peleka: 'Pelēkā pirts',
  kubls: firstRental(true),
};

const useStacking = () => {
  const [stack, setStack] = useState(() => window.matchMedia(STACK).matches);
  useEffect(() => {
    const q = window.matchMedia(STACK);
    const on = () => setStack(q.matches);
    q.addEventListener('change', on);
    return () => q.removeEventListener('change', on);
  }, []);
  return stack;
};

const PhotoViewer: React.FC<{ card: Card }> = ({ card }) => {
  const { t } = useTranslation('noma');
  const [current, setCurrent] = useState(0);
  const count = card.photos.length;
  const show = (i: number) => setCurrent(((i % count) + count) % count);

  return (
    <div className="group/photos relative h-72 overflow-hidden rounded-[1.75rem] bg-neutral-900 sm:h-96 lg:h-full">
      {card.photos.map((n, i) => (
        <img
          key={n}
          src={nomaPhoto(n)}
          srcSet={nomaSrcSet(n)}
          sizes="(min-width: 1024px) 50vw, 92vw"
          alt={i === current ? `${card.title} – ${i + 1}` : ''}
          aria-hidden={i !== current || undefined}
          loading="lazy"
          decoding="async"
          draggable={false}
          className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-[1000ms] ease-out motion-reduce:transition-none ${
            i === current ? 'scale-100 opacity-100' : 'scale-[1.04] opacity-0'
          }`}
        />
      ))}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />

      {(['prev', 'next'] as const).map((dir) => (
        <button
          key={dir}
          type="button"
          onClick={() => show(current + (dir === 'next' ? 1 : -1))}
          aria-label={t(dir === 'next' ? 'page.nextPhoto' : 'page.prevPhoto')}
          className={`absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-white transition-opacity duration-300 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white lg:opacity-0 lg:group-hover/photos:opacity-100 ${glassChip} ${
            dir === 'prev' ? 'left-4' : 'right-4'
          }`}
        >
          {dir === 'prev' ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
      ))}

      {/* Thumbnails on a glass strip. */}
      <div className={`absolute inset-x-3 bottom-3 flex gap-2 overflow-x-auto rounded-2xl p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:inset-x-4 sm:bottom-4 ${glassChip}`}>
        {card.photos.map((n, i) => (
          <button
            key={n}
            type="button"
            onClick={() => show(i)}
            aria-label={t('page.photo', { n: i + 1 })}
            aria-pressed={i === current}
            className={`relative h-12 w-16 shrink-0 overflow-hidden rounded-xl transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:h-14 sm:w-20 ${
              i === current ? 'ring-2 ring-green-300' : 'opacity-60 hover:opacity-100'
            }`}
          >
            <img src={nomaPhoto(n, 560)} alt="" loading="lazy" decoding="async" draggable={false} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
};

const StackCard: React.FC<{
  card: Card;
  index: number;
  total: number;
  progress: MotionValue<number>;
  stack: boolean;
}> = ({ card, index, total, progress, stack }) => {
  const { t } = useTranslation('noma');
  const Icon = card.icon;
  // Shrinks back as the cards after it come over it.
  const start = index / total;
  const scale = useTransform(progress, [start, 1], [1, 1 - (total - 1 - index) * 0.05]);
  const shade = useTransform(progress, [start, 1], [0, (total - 1 - index) * 0.18]);

  return (
    <div className={stack ? 'sticky top-0 flex h-[100svh] items-center' : 'py-3'}>
      <motion.article
        aria-labelledby={`sauna-${card.key}`}
        style={stack ? { scale, top: index * 22, transformOrigin: '50% 0%' } : undefined}
        className={`relative w-full overflow-hidden rounded-[2.25rem] p-3 sm:p-4 lg:h-[min(76svh,700px)] ${glassPanel}`}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(70% 60% at 85% 0%, rgba(34,197,94,0.14), transparent 70%)' }}
        />
        <div className="relative grid h-full gap-5 lg:grid-cols-[1.2fr_1fr] lg:gap-8">
          <PhotoViewer card={card} />

          <div className="flex flex-col px-2 pb-3 sm:px-4 lg:justify-center lg:py-6 lg:pr-8">
            <div className="flex items-center gap-3">
              <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${glassChip}`}>
                <Icon className="h-5 w-5 text-white" aria-hidden />
              </span>
              <span className="text-xs font-semibold tabular-nums tracking-[0.25em] text-white/50">
                {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
              </span>
            </div>
            <h3 id={`sauna-${card.key}`} className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              {card.title}
            </h3>
            <p className="mt-4 text-base leading-relaxed text-white/75 sm:text-lg">{card.description}</p>
            <ul className="mt-6 space-y-3">
              {card.checklist.map((item) => (
                <li key={item} className="flex items-start gap-3 text-white/85">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500 text-black">
                    <Check className="h-4 w-4" aria-hidden />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <button type="button" onClick={() => openRentalBooking(BOOKS[card.key])} className={primaryButton}>
                {t('page.book')}
              </button>
            </div>
          </div>
        </div>
        {/* Darkens as the next card comes over it. */}
        {stack && <motion.div aria-hidden className="pointer-events-none absolute inset-0 rounded-[2.25rem] bg-black" style={{ opacity: shade }} />}
      </motion.article>
    </div>
  );
};

const SaunaStack = () => {
  const { t } = useTranslation('noma');
  const [headRef, shown] = useShown<HTMLDivElement>(0.3);
  const containerRef = useRef<HTMLDivElement>(null);
  const stack = useStacking();
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });

  const saunas = t('saunas', { returnObjects: true }) as { title: string; description: string; checklist: string[] }[];
  const cards: Card[] = [
    { key: 'balta', icon: Home, photos: ['15', '17', '18', '19', '20'], ...saunas[0] },
    { key: 'peleka', icon: Flame, photos: ['23', '26', 'peleka-atputa', 'peleka-atputa-2', '41', '27'], ...saunas[1] },
    {
      key: 'kubls',
      icon: Droplets,
      photos: ['30', '1', '31', '29', '33'],
      title: t('herbTubs.title'),
      description: t('herbTubs.description'),
      checklist: t('page.herbFeatures', { returnObjects: true }) as string[],
    },
  ];

  return (
    <section aria-labelledby="saunas-heading" className="relative pb-10 lg:pb-24">
      <div ref={headRef} className="mx-auto max-w-7xl px-4 pt-6 text-center sm:px-6 lg:px-8">
        <p className={`${eyebrow} ${rise(shown).className}`}>{t('page.saunasEyebrow')}</p>
        <h2
          id="saunas-heading"
          style={rise(shown, 80).style}
          className={`mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-6xl ${rise(shown, 80).className}`}
        >
          {t('page.saunasTitle')}
        </h2>
      </div>
      <div ref={containerRef} className="relative mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:mt-0 lg:px-8">
        {cards.map((card, i) => (
          <StackCard key={card.key} card={card} index={i} total={cards.length} progress={scrollYProgress} stack={stack} />
        ))}
      </div>
    </section>
  );
};

export default SaunaStack;
