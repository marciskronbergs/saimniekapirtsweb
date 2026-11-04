import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import InlineBooking, { OPEN_INLINE_RITUAL } from '../booking/InlineBooking';
import { Reveal, SpotlightCard } from './ritualUi';
import { EASE, ghostButton, primaryButton } from './ritualStyles';
import { useHalfOverlap } from '../../hooks/useHalfOverlap';
import priceCatalog from '../../data/priceCatalog.json';

// The ritual prices: the three plans as glass cards, the most popular one
// raised and tinted green. On the rituals page the herbal tub scene above
// carries the heading ("Pirts Rituālu Cenas", in glass lettering), and on
// tablets and up the cards rise half their height into that scene; the
// section keeps its own heading for screen readers. A note in brackets at the end of a
// plan's description (the price without the herbal tub, who it is for) is
// shown on its own line under the price.
//
// Booking happens here, on the page: a plan's button opens the booking
// calendar and form below the cards (InlineBooking), sliding open, with the
// chosen plan marked; pressing it again, or the panel's close, folds it away.
// Other "book" buttons on the page open it too (openInlineRitualBooking).

interface Plan {
  title: string;
  price: string;
  description: string;
  features: string[];
  popular: boolean;
}

// Each plan's ritual in the price list (individual, for two, the family),
// picked in the booking form when its button opens it; the version with the
// herbal tub, as the plan's headline price is.
const PLAN_RITUAL = [0, 2, 4];

const splitNote = (text: string) => {
  const m = text.match(/^(.*?)\s*\(([^)]*)\)\s*\.?$/);
  return m ? { text: m[1], note: m[2] } : { text, note: '' };
};

const PriceTable = () => {
  const { t } = useTranslation('rituali');
  const plans = t('pricing.plans', { returnObjects: true }) as Plan[];
  // The plan whose booking is open below the cards.
  const [open, setOpen] = useState<number | null>(null);
  const bookingRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const overlap = useHalfOverlap(sectionRef, cardsRef);
  const scrollPending = useRef(false);

  const choose = (i: number) => {
    if (open === i) {
      setOpen(null);
      return;
    }
    scrollPending.current = true;
    setOpen(i);
  };

  // Opened from elsewhere on the page: the popular plan, unless one is given.
  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<{ plan?: number; handled: boolean }>).detail;
      detail.handled = true;
      const popular = Math.max(0, plans.findIndex((p) => p.popular));
      scrollPending.current = true;
      setOpen(detail.plan ?? popular);
      // Already open: still bring it into view.
      window.setTimeout(() => bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    };
    window.addEventListener(OPEN_INLINE_RITUAL, onOpen);
    return () => window.removeEventListener(OPEN_INLINE_RITUAL, onOpen);
  }, [plans]);

  // Once it has begun to open, bring the booking into view.
  useEffect(() => {
    if (open === null || !scrollPending.current) return;
    scrollPending.current = false;
    const timer = window.setTimeout(() => bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 260);
    return () => window.clearTimeout(timer);
  }, [open]);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="pricing-heading"
      className="relative z-10 px-4 pb-20 pt-2 sm:px-6 sm:pb-24 lg:pb-28"
      style={{ marginTop: -overlap }}
    >
      {/* The tub scene's black, easing into the page, from where the scene ends. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 h-40 bg-gradient-to-b from-black to-transparent" style={{ top: overlap }} />
      <div className="relative mx-auto max-w-6xl">
        <h2 id="pricing-heading" className="sr-only">
          {t('pricing.title')}
        </h2>
        <div ref={cardsRef} className="mt-8 grid gap-6 md:mt-6 md:grid-cols-3 md:items-stretch lg:gap-7">
          {plans.map((plan, i) => {
            const { text, note } = splitNote(plan.description);
            return (
              <Reveal key={plan.title} delay={0.08 * i} y={40} className={`flex ${plan.popular ? 'md:-mt-4 md:mb-4' : ''}`}>
                <SpotlightCard
                  tone={plan.popular ? 'green' : 'glass'}
                  className={`w-full transition-shadow duration-500 ${open === i ? 'ring-2 !ring-green-400/80 shadow-[0_0_60px_-15px_rgba(34,197,94,0.7)]' : ''}`}
                  contentClassName="flex h-full flex-col p-7 sm:p-8"
                >
                  {plan.popular && (
                    <span className="mb-5 inline-flex w-fit items-center gap-1.5 rounded-full bg-green-500 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-green-950">
                      <Sparkles aria-hidden className="h-3.5 w-3.5" />
                      {t('ui.popular')}
                    </span>
                  )}
                  <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-white/70">{plan.title}</h3>
                  <p className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-[2.6rem]">{plan.price}</p>
                  {note && <p className="mt-2 text-sm font-medium text-green-200/90">{note}</p>}
                  <p className="mt-5 text-base leading-relaxed text-white/75">{text}</p>

                  <ul className="mb-auto mt-6 space-y-3 border-t border-white/10 pt-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-base text-white/90">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500/20 text-green-300 ring-1 ring-green-400/40">
                          <Check aria-hidden className="h-3.5 w-3.5" />
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => choose(i)}
                    aria-expanded={open === i}
                    aria-controls="ritual-booking"
                    className={`mt-8 w-full ${plan.popular || open === i ? primaryButton : ghostButton}`}
                  >
                    {t('pricing.cta')}
                    <ChevronDown aria-hidden className={`h-4 w-4 transition-transform duration-500 ${open === i ? 'rotate-180' : ''}`} />
                  </button>
                </SpotlightCard>
              </Reveal>
            );
          })}
        </div>

        {/* The booking, sliding open below the chosen plan. */}
        <div ref={bookingRef} id="ritual-booking" className="scroll-mt-24">
          <AnimatePresence initial={false}>
            {open !== null && (
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
                    formType="ritual"
                    chosen={plans[open] ? `${plans[open].title} · ${plans[open].price}` : undefined}
                    preset={priceCatalog.ritual[PLAN_RITUAL[open]]?.label}
                    onClose={() => setOpen(null)}
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

export default PriceTable;
