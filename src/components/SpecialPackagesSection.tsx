import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Clock, Crown, Sparkles, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Bachelorette and bachelor sauna parties: two photo cards with a frosted
// glass panel each. On arrival the cards rise and unveil one after the other;
// on desktop they tilt a little towards the pointer, catch a sweep of light
// and show a second photo. The section stays transparent so the homepage's
// leaf backdrop shows through.
//
// Photos: public/media/events/, WebP from the Vecmeitas Pūrs and Vīru Paka
// pages' pictures (Supabase bildes/4, 3, 61, 64) at 1080 and 640 px.

const MEDIA = '/media/events';
const FINE_POINTER = '(hover: hover) and (pointer: fine)';
const REDUCED = '(prefers-reduced-motion: reduce)';
const MAX_TILT = 5; // degrees

const srcSet = (name: string) => `${MEDIA}/${name}-640.webp 640w, ${MEDIA}/${name}-1080.webp 1080w`;

interface Offer {
  to: string;
  photo: string;
  photoAlt: string;
  titleKey: 'bachelorette' | 'bachelor';
  textKey: 'bacheloretteText' | 'bachelorText';
  altKey: 'bacheloretteAlt' | 'bachelorAlt';
  Icon: typeof Crown;
  // Where the picture is anchored when cropped.
  focus: string;
}

const OFFERS: Offer[] = [
  {
    to: '/vecmeitas-purs',
    photo: 'bachelorette',
    photoAlt: 'bachelorette-alt',
    titleKey: 'bachelorette',
    textKey: 'bacheloretteText',
    altKey: 'bacheloretteAlt',
    Icon: Crown,
    focus: '60% 72%',
  },
  {
    to: '/viru-paka',
    photo: 'bachelor',
    photoAlt: 'bachelor-alt',
    titleKey: 'bachelor',
    textKey: 'bachelorText',
    altKey: 'bachelorAlt',
    Icon: Users,
    focus: '45% 30%',
  },
];

// The heading can be replaced where the cards are shown elsewhere (the
// rituals page names them its own way).
interface Heading {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}

const SpecialPackagesSection = ({ heading = {} }: { heading?: Heading }) => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const { t } = useTranslation('events');

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      data-visible={isVisible ? 'true' : 'false'}
      aria-labelledby="special-heading"
      className="sp-section relative overflow-hidden py-16 sm:py-20 md:py-28"
    >
      <style>{CSS}</style>
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="sp-rise mx-auto mb-12 max-w-3xl text-center sm:mb-16">
          <span className="sp-glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-green-100/90">
            <Sparkles aria-hidden="true" className="h-3.5 w-3.5 text-green-300" />
            {heading.eyebrow ?? t('eyebrow')}
          </span>
          <h2 id="special-heading" className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl xl:text-6xl">
            {heading.title ?? t('title')}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/60 sm:text-lg lg:text-xl">
            {heading.subtitle ?? t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
          {OFFERS.map((offer, i) => (
            <OfferCard key={offer.to} offer={offer} index={i} />
          ))}
        </div>

        <div className="sp-rise mt-12 flex justify-center sm:mt-14" style={{ ['--sp-delay' as string]: '520ms' }}>
          <Link
            to="/ipasiie-piedzivvojumi"
            className="sp-glass sp-more group inline-flex items-center gap-3 rounded-full py-2 pl-6 pr-2 text-base font-semibold text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-green-400/50"
          >
            {t('all')}
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white shadow-[0_6px_20px_-6px_rgba(34, 197, 94,0.8)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:rotate-45">
              <ArrowUpRight aria-hidden="true" className="h-5 w-5" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
};

const OfferCard: React.FC<{ offer: Offer; index: number }> = ({ offer, index }) => {
  const { t } = useTranslation('events');
  const cardRef = useRef<HTMLAnchorElement>(null);

  // The tilt eases towards the pointer in requestAnimationFrame, written as
  // CSS variables; no React render while the pointer moves.
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    if (!window.matchMedia(FINE_POINTER).matches || window.matchMedia(REDUCED).matches) return;
    let raf = 0;
    const target = { x: 0, y: 0 };
    const now = { x: 0, y: 0 };
    const tick = () => {
      now.x += (target.x - now.x) * 0.12;
      now.y += (target.y - now.y) * 0.12;
      card.style.setProperty('--ry', `${(now.x * MAX_TILT).toFixed(3)}deg`);
      card.style.setProperty('--rx', `${(-now.y * MAX_TILT).toFixed(3)}deg`);
      card.style.setProperty('--gx', `${(50 + now.x * 50).toFixed(2)}%`);
      card.style.setProperty('--gy', `${(50 + now.y * 50).toFixed(2)}%`);
      raf = Math.abs(target.x - now.x) + Math.abs(target.y - now.y) > 0.001 ? requestAnimationFrame(tick) : 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onMove = (e: PointerEvent) => {
      const r = card.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      target.y = ((e.clientY - r.top) / r.height) * 2 - 1;
      start();
    };
    const onLeave = () => {
      target.x = 0;
      target.y = 0;
      start();
    };
    card.addEventListener('pointermove', onMove);
    card.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      card.removeEventListener('pointermove', onMove);
      card.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  const { Icon } = offer;
  return (
    <div className="sp-card-wrap" style={{ ['--sp-delay' as string]: `${180 + index * 140}ms` }}>
      <Link
        ref={cardRef}
        to={offer.to}
        className="sp-card group relative block aspect-[4/5] sm:aspect-[4/3] lg:aspect-[16/11] overflow-hidden rounded-[28px] focus:outline-none focus-visible:ring-4 focus-visible:ring-green-400/60"
      >
        <div className="sp-photos absolute inset-0">
          <img
            src={`${MEDIA}/${offer.photo}-1080.webp`}
            srcSet={srcSet(offer.photo)}
            sizes="(min-width: 768px) 50vw, 100vw"
            alt={t(offer.altKey)}
            loading="lazy"
            decoding="async"
            className="sp-photo absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: offer.focus }}
          />
          <img
            src={`${MEDIA}/${offer.photoAlt}-1080.webp`}
            srcSet={srcSet(offer.photoAlt)}
            sizes="(min-width: 768px) 50vw, 100vw"
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="sp-photo sp-photo-alt absolute inset-0 h-full w-full object-cover"
          />
        </div>
        <div aria-hidden="true" className="sp-shade absolute inset-0" />
        <div aria-hidden="true" className="sp-glare absolute inset-0" />
        <div aria-hidden="true" className="sp-sheen absolute inset-0" />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-5 sm:p-6">
          <span className="sp-glass flex h-12 w-12 items-center justify-center rounded-2xl">
            <Icon aria-hidden="true" className="h-6 w-6 text-green-200" strokeWidth={1.75} />
          </span>
          <span aria-hidden="true" className="font-mono text-sm tracking-[0.3em] text-white/55">
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
          <div className="sp-glass sp-panel rounded-[22px] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold tracking-tight text-white sm:text-[1.7rem]">{t(offer.titleKey)}</h3>
                <p className="mt-1.5 text-[0.95rem] leading-relaxed text-white/75">{t(offer.textKey)}</p>
              </div>
              <span className="sp-arrow mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20">
                <ArrowUpRight aria-hidden="true" className="h-5 w-5" />
                <span className="sr-only">{t('cta')}</span>
              </span>
            </div>
            <ul className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-white/85">
              <li className="sp-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1.5">
                <Clock aria-hidden="true" className="h-3.5 w-3.5 text-green-300" />
                {t('meta.duration')}
              </li>
              <li className="sp-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1.5">
                <Users aria-hidden="true" className="h-3.5 w-3.5 text-green-300" />
                {t('meta.guests')}
              </li>
              <li className="sp-chip inline-flex items-center rounded-full px-3 py-1.5">{t('meta.price')}</li>
            </ul>
          </div>
        </div>
      </Link>
    </div>
  );
};

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

const CSS = `
.sp-glass {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.04));
  -webkit-backdrop-filter: blur(18px) saturate(150%);
  backdrop-filter: blur(18px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22), inset 0 -1px 0 rgba(255, 255, 255, 0.04), 0 10px 30px -12px rgba(0, 0, 0, 0.55);
}
.sp-panel {
  background: linear-gradient(140deg, rgba(255, 255, 255, 0.16), rgba(20, 40, 28, 0.28) 55%, rgba(10, 22, 15, 0.34));
  transition: transform 700ms ${EASE}, border-color 500ms ease;
}
.sp-chip { background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.12); }
.sp-more { transition: background-color 400ms ease, border-color 400ms ease, transform 500ms ${EASE}; }
.sp-more:hover { border-color: rgba(134, 239, 172, 0.45); transform: translateY(-2px); }

/* ---- card */
.sp-card {
  --rx: 0deg; --ry: 0deg; --gx: 50%; --gy: 50%;
  transform: perspective(1100px) rotateX(var(--rx)) rotateY(var(--ry));
  transform-style: preserve-3d;
  isolation: isolate;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1), 0 30px 60px -30px rgba(0, 0, 0, 0.8);
  transition: box-shadow 600ms ease;
  -webkit-mask-image: -webkit-radial-gradient(white, black); /* keeps the rounded clip while tilted in Safari */
}
.sp-card:hover { box-shadow: 0 0 0 1px rgba(134, 239, 172, 0.38), 0 34px 70px -28px rgba(0, 0, 0, 0.85), 0 0 60px -20px rgba(34, 197, 94, 0.45); }
.sp-photo { transform: scale(1.04); transition: transform 1600ms ${EASE}, opacity 900ms ease; will-change: transform; }
.sp-photo-alt { opacity: 0; transform: scale(1.12); }
.sp-card:hover .sp-photo { transform: scale(1.09); }
.sp-card:hover .sp-photo-alt { opacity: 1; transform: scale(1.04); }
.sp-shade {
  background:
    linear-gradient(180deg, rgba(4, 10, 6, 0.45) 0%, rgba(4, 10, 6, 0) 26%),
    linear-gradient(0deg, rgba(4, 10, 6, 0.9) 0%, rgba(4, 10, 6, 0.35) 40%, rgba(4, 10, 6, 0) 62%);
}
.sp-glare {
  background: radial-gradient(circle at var(--gx) var(--gy), rgba(255, 255, 255, 0.16), transparent 45%);
  opacity: 0; transition: opacity 600ms ease; mix-blend-mode: soft-light;
}
.sp-card:hover .sp-glare { opacity: 1; }
.sp-sheen {
  background: linear-gradient(115deg, transparent 35%, rgba(255, 255, 255, 0.16) 48%, rgba(255, 255, 255, 0.04) 54%, transparent 62%);
  transform: translateX(-120%);
  pointer-events: none;
}
.sp-card:hover .sp-sheen { transform: translateX(120%); transition: transform 1300ms ${EASE}; }
.sp-card:hover .sp-panel { transform: translateY(-4px); border-color: rgba(187, 247, 208, 0.3); }
.sp-arrow { transition: transform 600ms ${EASE}, background-color 400ms ease; }
.sp-card:hover .sp-arrow { transform: rotate(45deg); background-color: rgb(34, 197, 94); }

/* ---- arrival: once, in turn */
.sp-rise, .sp-card-wrap {
  opacity: 0;
  transform: translate3d(0, 36px, 0);
  transition: opacity 900ms ease var(--sp-delay, 0ms), transform 1100ms ${EASE} var(--sp-delay, 0ms);
}
.sp-card-wrap .sp-card { clip-path: inset(14% 0 0 0 round 28px); transition: clip-path 1200ms ${EASE} var(--sp-delay, 0ms), box-shadow 600ms ease; }
.sp-card-wrap .sp-photo { transform: scale(1.16); }
.sp-section[data-visible='true'] .sp-rise,
.sp-section[data-visible='true'] .sp-card-wrap { opacity: 1; transform: none; }
.sp-section[data-visible='true'] .sp-card { clip-path: inset(0 0 0 0 round 28px); }
.sp-section[data-visible='true'] .sp-photo { transform: scale(1.04); }
.sp-section[data-visible='true'] .sp-photo-alt { transform: scale(1.12); }
.sp-section[data-visible='true'] .sp-card:hover .sp-photo { transform: scale(1.09); }
.sp-section[data-visible='true'] .sp-card:hover .sp-photo-alt { transform: scale(1.04); }

@media (hover: none) {
  .sp-photo-alt { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .sp-rise, .sp-card-wrap { transform: none; transition: opacity 400ms ease; }
  .sp-card-wrap .sp-card { clip-path: none; transition: box-shadow 400ms ease; }
  .sp-photo, .sp-card-wrap .sp-photo, .sp-card:hover .sp-photo,
  .sp-section[data-visible='true'] .sp-photo, .sp-section[data-visible='true'] .sp-card:hover .sp-photo { transform: none; transition: opacity 400ms ease; }
  .sp-photo-alt { transform: none !important; }
  .sp-sheen { display: none; }
  .sp-card:hover .sp-panel, .sp-card:hover .sp-arrow, .sp-more:hover { transform: none; }
}
`;

export default SpecialPackagesSection;
