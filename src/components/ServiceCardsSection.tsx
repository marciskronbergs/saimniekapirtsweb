import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ChevronLeft, ChevronRight, Gift, Hand, Home, Leaf, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// The four ways in, right under the hero: photo cards for the ritual,
// the special occasions, the rental and the gift cards. On phones they
// sit side by side in a row that scrolls sideways with a swipe.

interface Service {
  key: 'ritual' | 'experiences' | 'rental' | 'giftCards';
  icon: LucideIcon;
  path: string;
  image: string;
}

// Photos from the site's own library, resized for cards (public/media/cards).
const services: Service[] = [
  { key: 'ritual', icon: Leaf, path: '/pirts-rituali', image: 'ritual' },
  { key: 'experiences', icon: Hand, path: '/ipasiie-piedzivvojumi', image: 'experiences' },
  { key: 'rental', icon: Home, path: '/pirts-noma', image: 'rental' },
  { key: 'giftCards', icon: Gift, path: '/davanu-kartes', image: 'giftcards' },
];

const ServiceCardsSection = () => {
  const { t } = useTranslation('services');
  const sectionRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [shown, setShown] = useState(false);
  // Phones: which card the swipeable row is on, for the dots and arrows.
  const [current, setCurrent] = useState(0);
  const scrollFrame = useRef(0);

  // The card nearest the row's left edge is the current one; read once per
  // frame while the row scrolls.
  const onRowScroll = () => {
    if (scrollFrame.current) return;
    scrollFrame.current = requestAnimationFrame(() => {
      scrollFrame.current = 0;
      const list = listRef.current;
      if (!list) return;
      const cards = Array.from(list.children) as HTMLElement[];
      const left = list.scrollLeft + list.offsetLeft;
      let nearest = 0;
      cards.forEach((card, i) => {
        if (Math.abs(card.offsetLeft - left) < Math.abs(cards[nearest].offsetLeft - left)) nearest = i;
      });
      setCurrent((prev) => (prev === nearest ? prev : nearest));
    });
  };
  useEffect(() => () => cancelAnimationFrame(scrollFrame.current), []);

  const goToCard = (i: number) => {
    const list = listRef.current;
    const card = list?.children[Math.max(0, Math.min(services.length - 1, i))] as HTMLElement | undefined;
    if (!list || !card) return;
    list.scrollTo({ left: card.offsetLeft - list.offsetLeft - 16, behavior: 'smooth' });
  };

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
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="pakalpojumi" aria-labelledby="services-heading" className="relative scroll-mt-16 py-16 sm:py-20 lg:py-24 overflow-hidden">
      {/* Wider than the page's usual column, so each card has room. */}
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="mb-8 sm:mb-12">
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.22em] text-green-400">{t('eyebrow')}</p>
          <h2 id="services-heading" className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
            {t('heading')}
          </h2>
        </div>

        {/* Phones: a row to swipe through by hand, card by card. */}
        <ul
          ref={listRef}
          onScroll={onRowScroll}
          className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto overscroll-x-contain px-4 pb-4 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4"
        >
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <li
                key={service.key}
                className={`w-[86%] shrink-0 snap-start sm:w-auto transition-all duration-700 ease-out motion-reduce:transition-none ${
                  shown ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100'
                }`}
                style={{ transitionDelay: shown ? `${index * 110}ms` : '0ms' }}
              >
                <Link
                  to={service.path}
                  className="group relative block aspect-[4/5] lg:aspect-[3/4] overflow-hidden rounded-[2rem] bg-neutral-900 ring-1 ring-white/15 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] transition-[box-shadow,ring-color] duration-500 hover:ring-green-300/60 hover:shadow-[0_30px_80px_-30px_rgba(34,197,94,0.5)] focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                >
                  <img
                    src={`/media/cards/${service.image}-900.webp`}
                    srcSet={`/media/cards/${service.image}-560.webp 560w, /media/cards/${service.image}-900.webp 900w`}
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 78vw"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06] motion-reduce:transition-none"
                  />
                  {/* Dark at the foot for the words, clear at the top for the photo. */}
                  {/* A light shade at the foot so the glass panel reads on any photo. */}
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-black/10" />
                  {/* A thin bright rim along the top edge of the card, like polished glass. */}
                  <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[2rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_0_0_1px_rgba(255,255,255,0.06)]" />

                  <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 sm:p-5">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/25 ring-1 ring-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] backdrop-blur-xl">
                      <Icon className="h-5 w-5 text-white" aria-hidden />
                    </span>
                    <span className="rounded-full bg-black/25 px-3 py-1 text-xs font-semibold tabular-nums tracking-[0.2em] text-white ring-1 ring-white/25 backdrop-blur-xl">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>

                  {/* The words on a frosted glass panel. */}
                  <div className="absolute inset-x-3 bottom-3 sm:inset-x-4 sm:bottom-4 overflow-hidden rounded-[1.5rem] bg-white/[0.12] p-5 sm:p-6 ring-1 ring-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_20px_40px_-20px_rgba(0,0,0,0.6)] backdrop-blur-2xl backdrop-saturate-150 transition-colors duration-500 group-hover:bg-white/[0.18]">
                    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent" />
                    <h3 className="relative text-2xl lg:text-[1.65rem] font-bold leading-tight text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.35)]">
                      {t(`${service.key}.title`)}
                    </h3>
                    <p className="relative mt-2 text-sm lg:text-[0.95rem] leading-relaxed text-white/85 line-clamp-3">
                      {t(`${service.key}.description`)}
                    </p>
                    <span className="relative mt-4 flex items-center justify-between text-sm font-semibold text-white">
                      {t('more')}
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-black shadow-[0_8px_20px_-6px_rgba(34,197,94,0.8)] transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:rotate-45">
                        <ArrowUpRight className="h-5 w-5" aria-hidden />
                      </span>
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Phones: glass arrows and dots that follow the swipe. */}
        <div className="mt-5 flex items-center justify-center gap-4 sm:hidden">
          <button
            type="button"
            onClick={() => goToCard(current - 1)}
            disabled={current === 0}
            aria-label={t('previous')}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-xl transition-opacity disabled:opacity-35 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            {services.map((service, i) => (
              <button
                key={service.key}
                type="button"
                onClick={() => goToCard(i)}
                aria-label={t(`${service.key}.title`)}
                aria-current={i === current ? 'true' : undefined}
                className={`tap-area h-2.5 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-300 ${
                  i === current ? 'w-7 bg-green-400' : 'w-2.5 bg-white/30'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => goToCard(current + 1)}
            disabled={current === services.length - 1}
            aria-label={t('next')}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-xl transition-opacity disabled:opacity-35 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default ServiceCardsSection;
