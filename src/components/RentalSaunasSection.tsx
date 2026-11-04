import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ChevronLeft, ChevronRight, Droplets, Flame, Home, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useHalfOverlap } from '../hooks/useHalfOverlap';

// "Pirts Noma (Ar vai Bez Zāļu Kubla)": the two saunas and the herbal tub as
// tall photo cards, in the same style as the experience cards above: the
// photo fills the card, the words sit on a frosted glass panel, glass chips
// on top. Each card keeps its two photos, crossfading behind glass arrows
// and dots. On tablets and up the cards rise half their height into the
// rental scene above; on phones they sit in a row that scrolls sideways.

interface Sauna {
  key: 'baltaPirts' | 'pelekaPirts' | 'herbTub';
  icon: LucideIcon;
  // Photo numbers from the site's library, resized in public/media/rental.
  photos: string[];
}

const saunas: Sauna[] = [
  { key: 'baltaPirts', icon: Home, photos: ['15', '17'] },
  { key: 'pelekaPirts', icon: Flame, photos: ['23', 'peleka-iekspuse'] },
  { key: 'herbTub', icon: Droplets, photos: ['30', '31'] },
];

const photoSrc = (n: string, size: 560 | 900) => `/media/rental/${n}-${size}.webp`;

const RentalSaunasSection = () => {
  const { t } = useTranslation('rental');
  const sectionRef = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  const cardsRef = useRef<HTMLUListElement>(null);
  const overlap = useHalfOverlap(sectionRef, cardsRef);
  const [photoIndex, setPhotoIndex] = useState<number[]>(saunas.map(() => 0));

  // The cards rise in once, one after another, when the row comes into view.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const showPhoto = (card: number, next: number) =>
    setPhotoIndex((prev) => prev.map((value, i) => (i === card ? (next + saunas[card].photos.length) % saunas[card].photos.length : value)));

  const glassChip =
    'bg-black/25 ring-1 ring-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] backdrop-blur-xl';

  return (
    <section
      ref={sectionRef}
      aria-labelledby="rental-heading"
      className="relative z-10 overflow-hidden pt-4 pb-16 sm:pt-6 sm:pb-20 lg:pt-8 lg:pb-24"
      style={{ marginTop: -overlap }}
    >
      {/* Black from where the scene above ends; the cards' upper half lies over the scene. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 bg-black" style={{ top: overlap }} />
      <div className="relative mx-auto max-w-[1680px] px-4 sm:px-6 lg:px-10">
        {/* Shown as glass lettering in the scene above (TubInterlude). */}
        <h2 id="rental-heading" className="sr-only">
          {t('title')}
        </h2>

        <ul ref={cardsRef} className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 md:pb-0">
          {saunas.map((sauna, index) => {
            const Icon = sauna.icon;
            const current = photoIndex[index];
            const title = t(`${sauna.key}.title`);
            return (
              <li
                key={sauna.key}
                className={`w-[86%] shrink-0 snap-start md:w-auto transition-all duration-700 ease-out motion-reduce:transition-none ${
                  shown ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100'
                }`}
                style={{ transitionDelay: shown ? `${index * 120}ms` : '0ms' }}
              >
                <article
                  aria-label={title}
                  className="group relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-neutral-900 ring-1 ring-white/15 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] transition-[box-shadow,ring-color] duration-500 hover:ring-green-300/60 hover:shadow-[0_30px_80px_-30px_rgba(34,197,94,0.5)]"
                >
                  {/* The card's photos, crossfading; the shown one zooms gently on hover. */}
                  {sauna.photos.map((n, i) => (
                    <img
                      key={n}
                      src={photoSrc(n, 900)}
                      srcSet={`${photoSrc(n, 560)} 560w, ${photoSrc(n, 900)} 900w`}
                      sizes="(min-width: 768px) 33vw, 86vw"
                      alt={i === current ? title : ''}
                      aria-hidden={i !== current || undefined}
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                      className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-[900ms] ease-out group-hover:scale-[1.06] motion-reduce:transition-none ${
                        i === current ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  ))}
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-black/10" />
                  <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[2rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_0_0_1px_rgba(255,255,255,0.06)]" />

                  {/* Top: icon, which photo, number. */}
                  <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 p-4 sm:p-5">
                    <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${glassChip}`}>
                      <Icon className="h-5 w-5 text-white" aria-hidden />
                    </span>
                    {sauna.photos.length > 1 && (
                      <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-2 ${glassChip}`}>
                        {sauna.photos.map((n, i) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => showPhoto(index, i)}
                            aria-label={t('showPhoto', { n: i + 1, title })}
                            aria-pressed={i === current}
                            className={`tap-area h-2 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                              i === current ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
                            }`}
                          />
                        ))}
                      </span>
                    )}
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold tabular-nums tracking-[0.2em] text-white ${glassChip}`}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Glass arrows, shown on hover (always on touch screens). */}
                  {sauna.photos.length > 1 &&
                    (['prev', 'next'] as const).map((dir) => (
                      <button
                        key={dir}
                        type="button"
                        onClick={() => showPhoto(index, current + (dir === 'next' ? 1 : -1))}
                        aria-label={t(dir === 'next' ? 'nextPhoto' : 'prevPhoto')}
                        className={`absolute top-[27%] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-white transition-opacity duration-300 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white md:opacity-0 md:group-hover:opacity-100 ${glassChip} ${
                          dir === 'prev' ? 'left-4' : 'right-4'
                        }`}
                      >
                        {dir === 'prev' ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      </button>
                    ))}

                  {/* The words on a frosted glass panel. */}
                  <div className="absolute inset-x-3 bottom-3 sm:inset-x-4 sm:bottom-4 overflow-hidden rounded-[1.5rem] bg-white/[0.12] p-5 sm:p-6 ring-1 ring-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_20px_40px_-20px_rgba(0,0,0,0.6)] backdrop-blur-2xl backdrop-saturate-150 transition-colors duration-500 group-hover:bg-white/[0.18]">
                    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent" />
                    <h3 className="relative text-2xl lg:text-[1.65rem] font-bold leading-tight text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.35)]">{title}</h3>
                    <p className="relative mt-2 text-sm lg:text-[0.95rem] leading-relaxed text-white/85 line-clamp-4">{t(`${sauna.key}.description`)}</p>
                    <Link
                      to="/pirts-noma"
                      className="relative mt-4 flex items-center justify-between text-sm font-semibold text-white focus:outline-none focus-visible:underline"
                    >
                      {t('more')}
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-black shadow-[0_8px_20px_-6px_rgba(34,197,94,0.8)] transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:rotate-45">
                        <ArrowUpRight className="h-5 w-5" aria-hidden />
                      </span>
                    </Link>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>

        <div className="mt-10 sm:mt-12 text-center">
          <Link
            to="/pirts-noma"
            className="inline-flex items-center rounded-full bg-green-600 px-9 py-4 text-lg font-semibold text-white shadow-[0_12px_32px_-12px_rgba(34,197,94,0.8),inset_0_1px_0_rgba(255,255,255,0.35)] transition-colors hover:bg-green-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-green-300/60"
          >
            {t('cta')}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default RentalSaunasSection;
