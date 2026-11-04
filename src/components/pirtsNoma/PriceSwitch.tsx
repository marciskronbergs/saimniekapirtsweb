import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CalendarCheck, ChevronDown, Clock, Users } from 'lucide-react';
import InlineBooking from '../booking/InlineBooking';
import { firstRental } from '../popup/rentalChoice';
import { eyebrow, glassPanel, nomaPhoto, primaryButton, rise, useShown } from './glass';

// The rental prices on one glass card: a glass switch between "without tub"
// and "with hot tub" (its pill slides between the two), the price range, and
// the durations, which change over one after another. A soft light follows
// the pointer across the card (the "spotlight card" from 21st.dev).
//
// Above the price, a framed scene of what is booked: both saunas in the
// forest, and with the tub the guests in the herbal tub in front of them (the
// rental scenes' cut-outs, public/media/interlude). Behind the durations, as
// with the group options on the rituals page, a photograph fading in from the
// right: the saunas, or the tub. The button opens the booking calendar and
// form right below the card (InlineBooking), as the rituals page's prices do.

const FOREST = '/media/interlude/forest-960.webp';
const SAUNAS = { src: '/media/interlude/saunas-1536.webp', small: '/media/interlude/saunas-960.webp' };
const TUB = { src: '/media/interlude/tub-1536.webp', small: '/media/interlude/tub-960.webp' };
// The faded photograph per option: without the tub, with it.
const PHOTOS = ['price-logs', 'price-leaves'];
const EASE = [0.22, 1, 0.36, 1] as const;

interface PriceRow {
  duration: string;
  price: string;
  note?: string;
}

interface PriceOption {
  title: string;
  priceRange: string;
  options: PriceRow[];
  popular?: boolean;
}

const PriceSwitch = () => {
  const { t } = useTranslation('noma');
  const reduced = useReducedMotion();
  const [ref, shown] = useShown<HTMLElement>(0.2);
  const options = t('pricing.options', { returnObjects: true }) as PriceOption[];
  // The popular one first.
  const [active, setActive] = useState(() => Math.max(0, options.findIndex((o) => o.popular)));
  const cardRef = useRef<HTMLDivElement>(null);
  const labels = [t('page.withoutTub'), t('page.withTub')];
  const option = options[active];
  const withTub = active === 1;
  const [booking, setBooking] = useState(false);
  const bookingRef = useRef<HTMLDivElement>(null);
  const scrollPending = useRef(false);

  const toggleBooking = () => {
    scrollPending.current = !booking;
    setBooking((b) => !b);
  };

  // Once it has begun to open, bring the booking into view.
  useEffect(() => {
    if (!booking || !scrollPending.current) return;
    scrollPending.current = false;
    const timer = window.setTimeout(
      () => bookingRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }),
      260
    );
    return () => window.clearTimeout(timer);
  }, [booking, reduced]);

  const follow = (e: React.PointerEvent) => {
    const card = cardRef.current;
    if (!card) return;
    const box = card.getBoundingClientRect();
    card.style.setProperty('--spot-x', `${e.clientX - box.left}px`);
    card.style.setProperty('--spot-y', `${e.clientY - box.top}px`);
  };

  return (
    <section ref={ref} id="cenas" aria-labelledby="pricing-heading" className="relative scroll-mt-20 py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className={`${eyebrow} ${rise(shown).className}`}>{t('page.pricingEyebrow')}</p>
          <h2
            id="pricing-heading"
            style={rise(shown, 80).style}
            className={`mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-6xl ${rise(shown, 80).className}`}
          >
            {t('pricing.title')}
          </h2>
        </div>

        {/* The switch. */}
        <div style={rise(shown, 160).style} className={`mt-10 flex justify-center ${rise(shown, 160).className}`}>
          <div role="tablist" aria-label={t('pricing.title')} className={`relative flex rounded-full p-1.5 ${glassPanel}`}>
            {options.map((o, i) => (
              <button
                key={o.title}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-controls="pricing-panel"
                onClick={() => setActive(i)}
                className="relative rounded-full px-5 py-3 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-300 sm:px-7 sm:text-base"
              >
                {i === active && (
                  <motion.span
                    layoutId="price-pill"
                    transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 32 }}
                    className="absolute inset-0 rounded-full bg-green-500 shadow-[0_10px_30px_-10px_rgba(34,197,94,0.9),inset_0_1px_0_rgba(255,255,255,0.45)]"
                  />
                )}
                <span className={`relative ${i === active ? 'text-black' : 'text-white/80 hover:text-white'}`}>{labels[i] ?? o.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div
          ref={cardRef}
          onPointerMove={follow}
          id="pricing-panel"
          role="tabpanel"
          style={rise(shown, 240).style}
          className={`group relative mt-8 overflow-hidden rounded-[2.25rem] ${glassPanel} ${rise(shown, 240).className}`}
        >
          {/* The spotlight. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{ background: 'radial-gradient(420px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(74,222,128,0.16), transparent 65%)' }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(60% 70% at 0% 0%, rgba(34,197,94,0.12), transparent 70%)' }}
          />
          {/* The option's photograph, fading in from the right behind the durations. */}
          <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-full lg:w-[64%]">
            <AnimatePresence initial={false}>
              <motion.img
                key={PHOTOS[active]}
                src={nomaPhoto(PHOTOS[active])}
                alt=""
                loading="lazy"
                decoding="async"
                initial={reduced ? false : { opacity: 0, scale: 1.04 }}
                animate={{ opacity: 0.42, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: EASE }}
                className="absolute inset-0 h-full w-full object-cover [mask-image:linear-gradient(to_top,black_5%,transparent_65%)] lg:[mask-image:linear-gradient(to_left,black_15%,transparent_95%)]"
              />
            </AnimatePresence>
          </div>

          <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 lg:p-12">
            <div className="flex flex-col">
              {/* What is booked: the saunas, and with the tub the tub in front. */}
              <div
                aria-hidden
                className="relative mb-7 aspect-[16/10] overflow-hidden rounded-[1.75rem] bg-[#10200f] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_24px_50px_-28px_rgba(0,0,0,0.9)] ring-1 ring-white/15"
              >
                <img src={FOREST} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-80 blur-[1.5px]" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/50" />
                <motion.img
                  src={SAUNAS.src}
                  srcSet={`${SAUNAS.small} 960w, ${SAUNAS.src} 1536w`}
                  sizes="(min-width: 1024px) 480px, 90vw"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  initial={false}
                  animate={{ x: withTub ? '-13%' : '0%', y: withTub ? '-5%' : '0%', scale: withTub ? 0.88 : 1 }}
                  transition={reduced ? { duration: 0 } : { duration: 0.8, ease: EASE }}
                  className="absolute bottom-[-3%] left-[2%] w-[96%] origin-bottom drop-shadow-[0_18px_22px_rgba(0,0,0,0.55)]"
                />
                <AnimatePresence initial={false}>
                  {withTub && (
                    <motion.img
                      key="tub"
                      src={TUB.src}
                      srcSet={`${TUB.small} 960w, ${TUB.src} 1536w`}
                      sizes="(min-width: 1024px) 420px, 80vw"
                      alt=""
                      loading="lazy"
                      decoding="async"
                      initial={reduced ? false : { opacity: 0, x: '18%', y: '6%' }}
                      animate={{ opacity: 1, x: '0%', y: '0%' }}
                      exit={reduced ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, x: '18%', transition: { duration: 0.45 } }}
                      transition={{ duration: 0.8, ease: EASE }}
                      className="absolute bottom-[-12%] right-[-8%] w-[80%] drop-shadow-[0_20px_26px_rgba(0,0,0,0.6)]"
                    />
                  )}
                </AnimatePresence>
                <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/45 to-transparent" />
              </div>
              {option.popular && (
                <span className="mb-4 w-max rounded-full bg-green-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-green-300 ring-1 ring-green-400/40">
                  {t('page.popular')}
                </span>
              )}
              <h3 className="text-2xl font-bold text-white sm:text-3xl">{option.title}</h3>
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={option.priceRange}
                  initial={reduced ? false : { opacity: 0, y: 14, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={reduced ? undefined : { opacity: 0, y: -10, filter: 'blur(6px)' }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-4 bg-gradient-to-b from-white to-green-200 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-6xl"
                >
                  {option.priceRange}
                </motion.p>
              </AnimatePresence>
              <p className="mt-4 text-white/60">{t('page.pricingNote')}</p>
              <div className="pt-8 lg:mt-auto lg:pt-9">
                <button
                  type="button"
                  onClick={toggleBooking}
                  aria-expanded={booking}
                  aria-controls="rental-booking"
                  className={`${primaryButton} w-full sm:w-auto`}
                >
                  <CalendarCheck className="h-5 w-5" aria-hidden />
                  {t('pricing.cta')}
                  <ChevronDown aria-hidden className={`h-4 w-4 transition-transform duration-500 ${booking ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.ul
                key={active}
                initial="out"
                animate="in"
                exit="out"
                variants={{ in: { transition: { staggerChildren: reduced ? 0 : 0.06 } }, out: {} }}
                className="space-y-3"
              >
                {option.options.map((row, i) => (
                  <motion.li
                    key={`${row.duration}-${row.price}-${i}`}
                    variants={
                      reduced
                        ? { in: { opacity: 1 }, out: { opacity: 1 } }
                        : { in: { opacity: 1, x: 0 }, out: { opacity: 0, x: 18 } }
                    }
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-center justify-between gap-4 rounded-2xl bg-black/30 px-4 py-4 ring-1 ring-white/10 transition-colors hover:bg-black/40 hover:ring-green-400/30 sm:px-6 sm:py-5"
                  >
                    <div className="flex items-center gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] ring-1 ring-white/15">
                        <Clock className="h-5 w-5 text-green-300" aria-hidden />
                      </span>
                      <div>
                        <div className="text-lg font-semibold text-white">{row.duration}</div>
                        {row.note && (
                          <div className="mt-0.5 flex items-center gap-1.5 text-sm text-white/55">
                            <Users className="h-3.5 w-3.5" aria-hidden />
                            {row.note.replace(/^\((.*)\)$/, '$1')}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-2xl font-bold tabular-nums text-green-300">{row.price}</span>
                  </motion.li>
                ))}
              </motion.ul>
            </AnimatePresence>
          </div>
        </div>

        {/* The booking, sliding open below the card. */}
        <div ref={bookingRef} id="rental-booking" className="scroll-mt-24">
          <AnimatePresence initial={false}>
            {booking && (
              <motion.div
                key="booking"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.7, ease: EASE }}
                className="overflow-hidden"
              >
                <motion.div
                  initial={{ y: 28, scale: 0.98 }}
                  animate={{ y: 0, scale: 1 }}
                  transition={{ duration: 0.7, ease: EASE }}
                  className="pt-10"
                >
                  <InlineBooking
                    formType="noma"
                    chosen={`${option.title} · ${option.priceRange}`}
                    preset={firstRental(withTub)}
                    onClose={() => setBooking(false)}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default PriceSwitch;
