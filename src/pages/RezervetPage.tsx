import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { Building2, Bus, CalendarDays, ChevronDown, Flame, Home, Mail, MapPin, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import HeaderSection from '../components/HeaderSection';
import FooterSection from '../components/FooterSection';
import { WhiskSeam } from '../components/whisks/WhiskAccent';
import LeafBackdrop from '../components/leaves/LeafBackdrop';
import ConsentGatedMap from '../components/shared/ConsentGatedMap';
import InlineBooking from '../components/booking/InlineBooking';
import RitualStillLifeHero, { OVERLAP_CLASS } from '../components/reserveHero/RitualStillLifeHero';
import { Reveal, SectionHeading, SpotlightCard } from '../components/pirtsRituali/ritualUi';
import { EASE, glass, glassGreen } from '../components/pirtsRituali/ritualStyles';

// "Veikt Rezervāciju": a forest still life with one button down to the
// booking (RitualStillLifeHero), then the two things to book (rituals, rental) as large
// glass choices with their photographs; choosing one opens the booking
// calendar and form right below (InlineBooking, the popup's own parts), and
// choosing the other swaps it. Then how to get here, the contacts and the
// map, and the company details, on the drifting leaves.

type Kind = 'ritual' | 'noma';

const CHOICES: { kind: Kind; titleKey: string; descKey: string; photo: string; Icon: typeof Flame }[] = [
  { kind: 'ritual', titleKey: 'ritualsTitle', descKey: 'ritualsDesc', photo: '/media/rituals/gallery/4.webp', Icon: Flame },
  { kind: 'noma', titleKey: 'rentTitle', descKey: 'rentDesc', photo: '/media/noma/15-960.webp', Icon: Home },
];

const RezervetPage = () => {
  const { t } = useTranslation('reserve');
  const { t: tCommon } = useTranslation('common');
  const [kind, setKind] = useState<Kind | null>(null);
  const bookingRef = useRef<HTMLDivElement>(null);
  const scrollPending = useRef(false);
  const chooseHeadingRef = useRef<HTMLHeadingElement>(null);

  // The hero's button: down to the choices, with focus on their heading.
  const toChoices = () => {
    const heading = chooseHeadingRef.current;
    if (!heading) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    heading.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    heading.focus({ preventScroll: true });
  };

  const choose = (next: Kind) => {
    if (next === kind) {
      bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    scrollPending.current = true;
    setKind(next);
  };

  useEffect(() => {
    if (!kind || !scrollPending.current) return;
    scrollPending.current = false;
    const timer = window.setTimeout(() => bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 260);
    return () => window.clearTimeout(timer);
  }, [kind]);

  const contacts = [
    { Icon: Mail, label: t('contactEmail'), value: 'info@saimniekapirts.lv', href: 'mailto:info@saimniekapirts.lv' },
    { Icon: Phone, label: t('contactPhone'), value: '+371 26 752 661', href: 'tel:+37126752661' },
    { Icon: MapPin, label: t('contactAddress'), value: tCommon('company.siteAddress') },
  ];
  const company = [
    [t('companyName'), tCommon('company.legalName')],
    [t('contactAddress'), tCommon('company.legalAddress')],
    [t('companyReg'), tCommon('company.regNumber')],
    [t('companyBank'), tCommon('company.bank')],
    [t('companyIBAN'), tCommon('company.iban')],
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-clip bg-[#0a0a0a]">
        <HeaderSection />
        <main>
          <RitualStillLifeHero onChooseDate={toChoices} />
          {/* Drawn over the hero's darkening lower edge: the choices rise out
              of the forest floor. Transparent, so the hero shows through. */}
          <LeafBackdrop className={`!bg-transparent ${OVERLAP_CLASS}`} clear={[{ side: 'right', top: 41 }]}>
            {/* What to book. */}
            <section aria-labelledby="reserve-heading" className="relative px-4 pb-10 sm:px-6">
              <div className="relative mx-auto max-w-6xl">
                <Reveal className="mx-auto max-w-2xl text-center">
                  <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-green-300 ${glass}`}>
                    <CalendarDays aria-hidden className="h-3.5 w-3.5" />
                    {t('ui.eyebrow')}
                  </span>
                  <h2
                    id="reserve-heading"
                    ref={chooseHeadingRef}
                    tabIndex={-1}
                    className="mt-5 scroll-mt-28 text-4xl font-bold tracking-tight text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.6)] focus:outline-none sm:text-5xl lg:text-6xl"
                  >
                    {t('title')}
                  </h2>
                  <p className="mt-4 text-lg leading-relaxed text-white/80 [text-shadow:0_1px_14px_rgba(0,0,0,0.7)] sm:text-xl">{t('ui.subtitle')}</p>
                </Reveal>

                <div role="tablist" aria-label={t('title')} className="mt-10 grid gap-5 md:grid-cols-2 lg:gap-6">
                  {CHOICES.map((c, i) => {
                    const active = kind === c.kind;
                    const { Icon } = c;
                    return (
                      <Reveal key={c.kind} delay={0.1 * i} y={36}>
                        <button
                          type="button"
                          role="tab"
                          id={`book-${c.kind}`}
                          aria-selected={active}
                          aria-controls="reserve-booking"
                          onClick={() => choose(c.kind)}
                          className={`group relative block w-full overflow-hidden rounded-[2rem] text-left transition-[box-shadow,transform] duration-500 hover:-translate-y-1 focus:outline-none focus-visible:ring-4 focus-visible:ring-green-400/60 ${
                            active ? `${glassGreen} ring-2 !ring-green-500/70` : glass
                          }`}
                        >
                          <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-[72%]">
                            <img
                              src={c.photo}
                              alt=""
                              decoding="async"
                              className={`h-full w-full object-cover transition-[opacity,transform] duration-[1200ms] ease-out [mask-image:linear-gradient(to_left,black_20%,transparent_95%)] group-hover:scale-105 ${
                                active ? 'opacity-75' : 'opacity-45 group-hover:opacity-60'
                              }`}
                            />
                          </span>
                          <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/55 via-black/15 to-transparent" />
                          <span className="relative flex min-h-[18rem] flex-col p-7 sm:p-9">
                            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-600/25 ring-1 ring-green-400/40">
                              <Icon aria-hidden className="h-6 w-6 text-green-300" strokeWidth={1.75} />
                            </span>
                            <span className="mt-5 block text-3xl font-bold tracking-tight text-white sm:text-4xl">{t(c.titleKey)}</span>
                            <span className="mt-3 block max-w-[24rem] text-base leading-relaxed text-white/80">{t(c.descKey)}</span>
                            <span className={`mt-auto inline-flex items-center gap-2 pt-7 text-sm font-semibold ${active ? 'text-green-300' : 'text-white'}`}>
                              {active ? t('ui.opened') : t('ui.open')}
                              <ChevronDown aria-hidden className={`h-4 w-4 transition-transform duration-500 ${active ? 'rotate-180' : 'group-hover:translate-y-0.5'}`} />
                            </span>
                          </span>
                        </button>
                      </Reveal>
                    );
                  })}
                </div>

                {/* The calendar and form, sliding open below the choice. */}
                <div ref={bookingRef} id="reserve-booking" role="tabpanel" aria-labelledby={kind ? `book-${kind}` : undefined} className="scroll-mt-24">
                  <AnimatePresence initial={false}>
                    {kind && (
                      <motion.div
                        key="booking"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.7, ease: EASE }}
                        className="overflow-hidden"
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.div
                            key={kind}
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.45, ease: EASE }}
                            className="pt-10"
                          >
                            <InlineBooking
                              formType={kind}
                              chosen={t(kind === 'ritual' ? 'ritualsTitle' : 'rentTitle')}
                              onClose={() => setKind(null)}
                            />
                          </motion.div>
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </section>

            {/* A maple whisk from the right, beside "Atrašanās Vieta", clear of
                the booking above and the map below. */}
            <WhiskSeam asset="maple-right" width="27vw" top="8px" shiftY="0%" rotate={2} drift={18} hideOnPhones />
            {/* Getting here, contacts, the map. */}
            <section aria-labelledby="location-heading" className="px-4 py-20 sm:px-6 sm:py-24">
              <div className="mx-auto max-w-6xl">
                <SectionHeading id="location-heading" eyebrow={t('ui.contactEyebrow')} title={t('location')} />
                <div className="mt-12 grid gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <Reveal>
                      <SpotlightCard contentClassName="flex gap-4 p-6 sm:p-7">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-600/20 ring-1 ring-green-400/30">
                          <Bus aria-hidden className="h-6 w-6 text-green-300" />
                        </span>
                        <span>
                          <span className="block text-lg font-semibold text-white">{t('transport').replace(/:$/, '')}</span>
                          <span className="mt-2 block text-base leading-relaxed text-white/75">{t('transportDesc')}</span>
                        </span>
                      </SpotlightCard>
                    </Reveal>
                    {contacts.map(({ Icon, label, value, href }, i) => {
                      const body = (
                        <>
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-600/20 ring-1 ring-green-400/30">
                            <Icon aria-hidden className="h-5 w-5 text-green-300" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-white/50">{label}</span>
                            <span className="mt-0.5 block text-base font-semibold text-white">{value}</span>
                          </span>
                        </>
                      );
                      return (
                        <Reveal key={label} delay={0.05 * (i + 1)}>
                          {href ? (
                            <a
                              href={href}
                              className={`flex items-center gap-4 rounded-2xl p-4 transition-colors hover:bg-white/[0.1] focus:outline-none focus-visible:ring-2 focus-visible:ring-green-300 ${glass}`}
                            >
                              {body}
                            </a>
                          ) : (
                            <div className={`flex items-center gap-4 rounded-2xl p-4 ${glass}`}>{body}</div>
                          )}
                        </Reveal>
                      );
                    })}
                  </div>
                  <Reveal delay={0.1} y={36}>
                    <div className={`h-full overflow-hidden rounded-[2rem] p-2.5 ${glass}`}>
                      <div className="h-full min-h-[400px] overflow-hidden rounded-[1.5rem]">
                        <ConsentGatedMap height={460} />
                      </div>
                    </div>
                  </Reveal>
                </div>
              </div>
            </section>

            {/* Company details. */}
            <section aria-labelledby="company-heading" className="px-4 pb-24 sm:px-6 sm:pb-28">
              <Reveal className="mx-auto max-w-6xl">
                <div className={`relative overflow-hidden rounded-[2rem] p-7 sm:p-10 ${glass}`}>
                  <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-green-500/10 blur-3xl" />
                  <h2 id="company-heading" className="relative flex items-center gap-3 text-2xl font-bold text-white">
                    <Building2 aria-hidden className="h-6 w-6 text-green-300" />
                    {t('companyInfo')}
                  </h2>
                  <dl className="relative mt-8 grid gap-x-10 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                    {company.map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">{label}</dt>
                        <dd className="mt-1 break-words text-base text-white/90">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </Reveal>
            </section>
          </LeafBackdrop>
        </main>
        <FooterSection />
      </div>
    </MotionConfig>
  );
};

export default RezervetPage;
