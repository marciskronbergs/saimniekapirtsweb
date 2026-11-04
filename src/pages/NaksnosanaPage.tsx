import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MotionConfig, motion, useScroll, useTransform } from 'framer-motion';
import { ArrowDown, ArrowRight, BedDouble, Bus, CookingPot, Flame, Moon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import HeaderSection from '../components/HeaderSection';
import FooterSection from '../components/FooterSection';
import LeafBackdrop from '../components/leaves/LeafBackdrop';
import StayRoom from '../components/naksnosana/StayRoom';
import { WhiskSeam } from '../components/whisks/WhiskAccent';
import { Reveal, SectionHeading, SpotlightCard } from '../components/pirtsRituali/ritualUi';
import { EASE, ghostButton, glass, primaryButton } from '../components/pirtsRituali/ritualStyles';

// "Nakšņošana": staying the night after the sauna. A full-bleed bedroom
// photograph opens the page, drifting slowly and sinking as the page
// scrolls, with the words on a glass card; then the two places to stay as
// glass blocks with their photos; then the price and the way here, on the
// drifting leaves. The booking button goes to /rezervet, as before.
//
// Photos: the 2023 shoot (house, living, attic, attic2, tub, herbroom,
// kitchen) and the site's library (bildes/58, vel/76–80), as local WebP copies
// in public/media/noma/stay-<n>-{560,960}.webp.

const HERO = '/media/noma/stay-attic2-1920.webp';

const NaksnosanaPage = () => {
  const { t } = useTranslation('accommodation');
  const navigate = useNavigate();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const photoY = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const cardY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const book = () => navigate('/rezervet');
  const perks = t('perks', { returnObjects: true }) as Record<'beds' | 'atmosphere' | 'kitchen', string>;

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-clip bg-[#0a0a0a]">
        <HeaderSection />
        <main>
          {/* The bedroom, full bleed, with the words on glass. */}
          <section ref={heroRef} aria-labelledby="stay-page-heading" className="relative isolate flex min-h-[92svh] items-end overflow-clip pt-20">
            <motion.div aria-hidden className="absolute inset-0 -z-10" style={{ y: photoY }}>
              <motion.img
                src={HERO}
                alt=""
                decoding="async"
                fetchPriority="high"
                initial={{ scale: 1.12, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 2.2, ease: EASE }}
                className="h-full w-full object-cover"
              />
            </motion.div>
            <div
              aria-hidden
              className="absolute inset-0 -z-10"
              style={{
                background:
                  'linear-gradient(180deg, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.15) 35%, rgba(10,10,10,0.55) 70%, #0a0a0a 100%), radial-gradient(60% 50% at 20% 80%, rgba(34,197,94,0.18), transparent 70%)',
              }}
            />

            <motion.div style={{ y: cardY }} className="mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6 sm:pb-20">
              <motion.div
                initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 1.1, ease: EASE, delay: 0.35 }}
                className={`relative max-w-2xl overflow-hidden rounded-[2rem] p-7 sm:p-10 ${glass}`}
              >
                <div aria-hidden className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-green-500/20 blur-3xl" />
                <span className="relative inline-flex items-center gap-2 rounded-full bg-green-600/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-green-300 ring-1 ring-green-400/30">
                  <Moon aria-hidden className="h-3.5 w-3.5" />
                  {t('ui.eyebrow')}
                </span>
                <h1 id="stay-page-heading" className="relative mt-5 text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
                  {t('title')}
                </h1>
                <p className="relative mt-5 text-lg leading-relaxed text-white/80 sm:text-xl">{t('description')}</p>
                <p className="relative mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-3xl font-bold text-white">{t('price')}</span>
                  <span className="text-base text-white/65">{t('priceNote')}</span>
                  <span className="text-sm text-white/50">{t('priceMin')}</span>
                </p>
                <div className="relative mt-8 flex flex-col gap-3 sm:flex-row">
                  <button type="button" onClick={book} className={primaryButton}>
                    {t('cta')}
                    <ArrowRight aria-hidden className="h-5 w-5" />
                  </button>
                  <a href="#naktsmitnes" className={ghostButton}>
                    {t('ui.see')}
                    <ArrowDown aria-hidden className="h-5 w-5" />
                  </a>
                </div>
              </motion.div>
            </motion.div>
          </section>

          {/* An oak whisk from the right, beside "Kur pārnakšņot" (the
              birch leaf that sat there is left out). */}
          <WhiskSeam asset="oak-right" width="29vw" shiftY="-22%" rotate={2} phone={{ width: '50vw', shiftY: '-48%' }} />
          <LeafBackdrop className="!bg-[#0a0a0a]" clear={[{ side: 'right', top: 2 }]}>
            {/* The two places to stay. */}
            <section id="naktsmitnes" aria-labelledby="rooms-heading" className="scroll-mt-20 px-4 py-20 sm:px-6 sm:py-24">
              <div className="mx-auto max-w-7xl">
                <SectionHeading id="rooms-heading" eyebrow={t('ui.roomsEyebrow')} title={t('ui.roomsTitle')} />
                <div className="mt-12 space-y-8 lg:mt-16 lg:space-y-10">
                  <StayRoom
                    index={0}
                    title={t('whiteSauna.title')}
                    description={t('whiteSauna.description')}
                    photos={['house', 'living', 'attic', 'attic2', '58', '80']}
                    perks={[
                      { label: perks.beds, Icon: BedDouble },
                      { label: perks.atmosphere, Icon: Flame },
                    ]}
                  />
                  <StayRoom
                    index={1}
                    flip
                    title={t('blackSauna.title')}
                    description={t('blackSauna.description')}
                    photos={['herbroom', '76', 'kitchen', '79']}
                    perks={[
                      { label: perks.beds, Icon: BedDouble },
                      { label: perks.kitchen, Icon: CookingPot },
                      { label: perks.atmosphere, Icon: Flame },
                    ]}
                  />
                </div>
              </div>
            </section>


            {/* The price, and the way here. */}
            <section aria-labelledby="stay-price-heading" className="px-4 pb-24 sm:px-6 sm:pb-28">
              <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_1fr]">
                <Reveal y={36}>
                  <SpotlightCard tone="green" className="h-full" contentClassName="flex h-full flex-col p-8 sm:p-10">
                    <h2 id="stay-price-heading" className="text-sm font-semibold uppercase tracking-[0.22em] text-green-200">
                      {t('priceTitle')}
                    </h2>
                    <p className="mt-4 flex flex-wrap items-baseline gap-x-3">
                      <span className="text-6xl font-bold tracking-tight text-white sm:text-7xl">{t('price')}</span>
                      <span className="text-xl text-white/70">{t('priceNote')}</span>
                    </p>
                    <p className="mt-2 text-base text-white/60">{t('priceMin')}</p>
                    <ul className="mt-8 flex flex-wrap gap-2">
                      {[
                        { label: perks.beds, Icon: BedDouble },
                        { label: perks.atmosphere, Icon: Flame },
                        { label: perks.kitchen, Icon: CookingPot },
                      ].map(({ label, Icon }) => (
                        <li key={label} className="flex items-center gap-2 rounded-full bg-black/25 px-4 py-2 text-sm text-white/90 ring-1 ring-white/15">
                          <Icon aria-hidden className="h-4 w-4 text-green-300" />
                          {label}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-10 lg:mt-auto lg:pt-10">
                      <button type="button" onClick={book} className={`${primaryButton} w-full sm:w-auto`}>
                        {t('cta')}
                        <ArrowRight aria-hidden className="h-5 w-5" />
                      </button>
                    </div>
                  </SpotlightCard>
                </Reveal>
                <Reveal y={36} delay={0.1}>
                  <SpotlightCard className="h-full" contentClassName="flex h-full flex-col p-8 sm:p-10">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-600/20 ring-1 ring-green-400/30">
                      <Bus aria-hidden className="h-7 w-7 text-green-300" strokeWidth={1.7} />
                    </span>
                    <h2 className="mt-6 text-2xl font-bold text-white">{t('transport.title').replace(/:$/, '')}</h2>
                    <p className="mt-4 text-base leading-relaxed text-white/75">{t('transport.description')}</p>
                  </SpotlightCard>
                </Reveal>
              </div>
            </section>
          </LeafBackdrop>
        </main>
        <FooterSection />
      </div>
    </MotionConfig>
  );
};

export default NaksnosanaPage;
