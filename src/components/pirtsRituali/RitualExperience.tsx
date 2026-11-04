import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useSpring } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Play } from 'lucide-react';
import { Reveal, SectionHeading } from './ritualUi';
import { EASE, glass, primaryButton } from './ritualStyles';
import { openInlineRitualBooking } from '../booking/InlineBooking';

// "Pilnā Pirts Rituāla Pieredze": the seven steps as a story told by
// scrolling. Desktop: the photograph stays in place on the left and changes
// as each step reaches the middle of the window; a rail beside the steps
// fills as you go, and the dots on the photo jump to a step. Each step has
// several photographs: on desktop the frame moves through the step's own
// ones while it is in view (glass thumbnails pick one); on phones each step's
// card has them in a row to swipe.
//
// Each step opens with its own short film (public/media/rituals/step-videos/
// step-<n>.mp4: 9:16, 540×960, silent, 10–14 s, cut from the 2023–2026
// shoots, with step-<n>.webp as its poster), then its photographs
// (rituals/step-photos). The film plays only while its step is the one in
// view; with reduced motion it stays on its poster.

const VIDEOS = '/media/rituals/step-videos';
const PHOTOS = '/media/rituals/step-photos';
const photos = (...names: string[]) => names.map((n) => `${PHOTOS}/${n}.webp`);

interface StepMedia {
  video: string;
  poster: string;
  photos: string[];
}

const STEP_MEDIA: StepMedia[] = [
  // Warming up in the herbal tub
  ['paru-kubls', 'kubls-grupa-ar-pirtnieku', 'kubls-pari-lapas', 'kubls-draudzenes-1', 'paru-kubls-lapas'],
  // Herbal tea
  ['teja-lesana-kublaa', 'teja-pirtnieks', 'teja-kublaa-pasniegsana'],
  // Whisking
  ['periens-viriete', 'periens-pirtniece', 'periens-1', 'periens-pirtnieks'],
  // Herbal scrubs
  ['skrubis-uz-muguras', 'paru-skrubis-galds', 'skrubja-trauks-uz-papardem', 'skrubis-birst-traukaa'],
  // Warm honey
  ['medus-trauks-tuvplans', 'medus-roka-trauks', 'medus-pile'],
  // The cool pond
  ['peldinasana-dikis', 'peldinasana-1', 'iesana-diki'],
  // Resting in blankets
  ['ietisana-1', 'ietits-pie-pirts', 'ietisana-tuvplans-ozola-lapas'],
].map((names, i) => ({
  video: `${VIDEOS}/step-${i + 1}.mp4`,
  poster: `${VIDEOS}/step-${i + 1}.webp`,
  photos: photos(...names),
}));

// What the frame can show for a step: its film (shot 0), then its photos.
const shotsOf = (i: number) => 1 + (STEP_MEDIA[i]?.photos.length ?? 0);
// How long the film, then each photo, shows on desktop.
const VIDEO_MS = 13000;
const CYCLE_MS = 3600;

// A silent film that plays only while `playing` is true.
const StepVideo = ({ src, poster, playing, className }: { src: string; poster: string; playing: boolean; className: string }) => {
  const ref = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (playing && !reduced) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [playing, reduced]);
  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden
      className={className}
    />
  );
};

interface Step {
  title: string;
  description: string;
}

const RitualExperience = () => {
  const { t } = useTranslation('rituali');
  const steps = t('experience.steps', { returnObjects: true }) as Step[];
  const [active, setActive] = useState(0);
  // What the desktop frame shows for the active step: 0 is its film, then its photos.
  const [shot, setShot] = useState(0);
  const reduced = useReducedMotion();
  // Only one of the two layouts is on screen, so only its films play.
  const [desktop, setDesktop] = useState(() => typeof window !== 'undefined' && matchMedia('(min-width: 1024px)').matches);
  useEffect(() => {
    const media = matchMedia('(min-width: 1024px)');
    const update = () => setDesktop(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const listRef = useRef<HTMLOListElement>(null);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);

  // The step crossing the middle of the window is the active one.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.step));
        }
      },
      { rootMargin: '-48% 0px -48% 0px' }
    );
    stepRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [steps.length]);

  // A new step starts with its film, then moves through its photos.
  useEffect(() => setShot(0), [active]);
  useEffect(() => {
    if (reduced) return;
    const timer = window.setTimeout(() => setShot((n) => (n + 1) % shotsOf(active)), shot === 0 ? VIDEO_MS : CYCLE_MS);
    return () => window.clearTimeout(timer);
  }, [active, reduced, shot]);

  // The rail fills with the list's scroll, eased.
  const { scrollYProgress } = useScroll({ target: listRef, offset: ['start 55%', 'end 55%'] });
  const rail = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });

  const goTo = (i: number) => stepRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  return (
    <section aria-labelledby="experience-heading" className="relative px-4 py-20 sm:px-6 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          id="experience-heading"
          eyebrow={t('ui.experienceEyebrow')}
          title={t('experience.title')}
          subtitle={t('experience.subtitle')}
        />

        <div className="mt-14 grid gap-10 lg:mt-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16">
          {/* Desktop: the photograph of the step in view. */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <div className="relative aspect-[4/5] max-h-[calc(100svh-8rem)] w-full overflow-hidden rounded-[2rem] ring-1 ring-white/15 shadow-[0_40px_90px_-40px_rgba(0,0,0,0.95)]">
                {STEP_MEDIA.flatMap((media, i) => {
                  const fade = (on: boolean) =>
                    `absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-opacity ${
                      on ? 'scale-100 opacity-100' : 'scale-[1.06] opacity-0'
                    }`;
                  const filmOn = desktop && i === active && shot === 0;
                  return [
                    <StepVideo key={`${i}-film`} src={media.video} poster={media.poster} playing={filmOn} className={fade(filmOn)} />,
                    ...media.photos.map((src, k) => {
                      const on = i === active && k + 1 === shot;
                      return (
                        <img
                          key={`${i}-${src}`}
                          src={src}
                          alt={on ? steps[i]?.title : ''}
                          aria-hidden={!on || undefined}
                          loading="lazy"
                          decoding="async"
                          className={fade(on)}
                        />
                      );
                    }),
                  ];
                })}
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/20" />

                {/* The step's film and photos: glass thumbnails along the top. */}
                <div className={`absolute left-4 top-4 flex gap-2 rounded-2xl p-2 ${glass}`}>
                  {[STEP_MEDIA[active].poster, ...STEP_MEDIA[active].photos].map((src, k) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setShot(k)}
                      aria-label={`${steps[active]?.title} – ${k + 1}`}
                      aria-pressed={k === shot}
                      className={`relative h-11 w-14 overflow-hidden rounded-xl transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-300 ${
                        k === shot ? 'ring-2 ring-green-400' : 'opacity-55 hover:opacity-100'
                      }`}
                    >
                      <img src={src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                      {k === 0 && (
                        <span aria-hidden className="absolute inset-0 flex items-center justify-center bg-black/25">
                          <Play className="h-4 w-4 fill-white text-white" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Which step, and a way to jump between them. */}
                <div className={`absolute inset-x-4 bottom-4 flex items-center justify-between gap-4 rounded-2xl px-5 py-4 ${glass}`}>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-300">
                      {t('ui.step')} {active + 1} / {steps.length}
                    </p>
                    <motion.p
                      key={active}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, ease: EASE }}
                      className="mt-1 truncate text-lg font-semibold text-white"
                    >
                      {steps[active]?.title}
                    </motion.p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    {steps.map((step, i) => (
                      <button
                        key={step.title}
                        type="button"
                        onClick={() => goTo(i)}
                        aria-label={`${t('ui.step')} ${i + 1}: ${step.title}`}
                        aria-current={i === active ? 'step' : undefined}
                        className={`h-2 rounded-full transition-all duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-300 ${
                          i === active ? 'w-6 bg-green-500' : 'w-2 bg-white/35 hover:bg-white/60'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* The steps, with the rail. */}
          <div className="relative">
            <div aria-hidden className="absolute bottom-6 left-[1.4rem] top-6 hidden w-px bg-white/10 sm:block">
              <motion.div className="h-full w-full origin-top bg-gradient-to-b from-green-300 to-green-600" style={{ scaleY: rail }} />
            </div>
            <ol ref={listRef} className="relative space-y-6 lg:space-y-0">
              {steps.map((step, i) => (
                <li
                  key={step.title}
                  ref={(el) => (stepRefs.current[i] = el)}
                  data-step={i}
                  className="lg:flex lg:min-h-[62svh] lg:items-center"
                >
                  <Reveal className="w-full" y={36}>
                    <div className="flex gap-4 sm:gap-6">
                      <span
                        aria-hidden
                        className={`relative z-10 mt-1 hidden h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all duration-500 sm:flex ${
                          i <= active
                            ? 'bg-green-600 text-white shadow-[0_0_24px_rgba(34, 197, 94,0.6)]'
                            : 'bg-[#0d1410] text-white/60 ring-1 ring-white/15'
                        }`}
                      >
                        {i + 1}
                      </span>
                      <article
                        className={`w-full overflow-hidden rounded-[1.75rem] transition-[opacity,transform] duration-700 ${glass} ${
                          i === active ? 'lg:opacity-100' : 'lg:opacity-55'
                        }`}
                      >
                        {/* Phones and tablets: the step's photograph in the card. */}
                        <div className="relative aspect-[4/5] overflow-hidden sm:aspect-[4/3] lg:hidden">
                          {/* The step's film, then its photos, in a row to swipe. */}
                          <div className="flex h-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            <StepVideo
                              src={STEP_MEDIA[i].video}
                              poster={STEP_MEDIA[i].poster}
                              playing={!desktop && i === active}
                              className="h-full w-full shrink-0 snap-center object-cover"
                            />
                            {STEP_MEDIA[i].photos.map((src) => (
                              <img
                                key={src}
                                src={src}
                                alt={step.title}
                                loading="lazy"
                                decoding="async"
                                className="h-full w-full shrink-0 snap-center object-cover"
                              />
                            ))}
                          </div>
                          <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/45 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/20 backdrop-blur-md">
                            {shotsOf(i)} ⟷
                          </span>
                          <span className="absolute left-4 top-4 rounded-full bg-black/45 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-green-200 backdrop-blur-md sm:hidden">
                            {t('ui.step')} {i + 1}
                          </span>
                        </div>
                        <div className="p-6 sm:p-7">
                          <p className="hidden text-xs font-semibold uppercase tracking-[0.2em] text-green-300 sm:block">
                            {t('ui.step')} {i + 1}
                          </p>
                          <h3 className="mt-1 text-xl font-bold text-white sm:text-2xl">{step.title}</h3>
                          <p className="mt-3 text-base leading-relaxed text-white/75">{step.description}</p>
                        </div>
                      </article>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <Reveal className="mt-14 flex justify-center lg:mt-10">
          <button type="button" onClick={() => openInlineRitualBooking()} className={primaryButton}>
            {t('experience.cta')}
          </button>
        </Reveal>
      </div>
    </section>
  );
};

export default RitualExperience;
