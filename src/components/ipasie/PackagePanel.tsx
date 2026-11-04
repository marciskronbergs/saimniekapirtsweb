import { motion } from 'framer-motion';
import { BedDouble, CalendarCheck, Clock, Leaf, Quote, UserCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PhotoCarousel from '../pirtsRituali/PhotoCarousel';
import { Reveal, SpotlightCard } from '../pirtsRituali/ritualUi';
import { EASE, glass, glassGreen, openRitualBooking, primaryButton } from '../pirtsRituali/ritualStyles';
import priceCatalog from '../../data/priceCatalog.json';
import type { ExperienceId } from './ExperienceTabs';

// One experience's programme, as it opens under the tabs: the folk song or
// saying, the photographs, the story and the essentials, what the programme
// includes step by step, the extras, and the way to book. The content is the
// former Vecmeitas Pūrs and Vīru Paka pages' (vecmeitas.json / viru.json).
//
// Photos: public/media/events/gallery/<n>.webp, 1080 px copies of the
// Supabase bildes/<n>.png those pages showed.

const PHOTOS: Record<ExperienceId, string[]> = {
  vecmeitas: ['4', '3', '13', '50', '72'],
  viru: ['60', '61', '62', '64', '65'],
};
const NAME_KEY: Record<ExperienceId, string> = { vecmeitas: 'bachelorette', viru: 'bachelor' };
const DETAIL_ICONS = { duration: Clock, included: Leaf, master: UserCheck, availability: CalendarCheck } as const;

interface Extra {
  name: string;
  price: string;
}

// Each extra's photograph, fading in from the right of its card as the group
// options' do on the rituals page: matched by name, so it holds in both
// programmes. The vibroacoustic massage has no photograph of its own: a guest
// resting on the leaves, with soft rings of vibration spreading over it.
const EXTRA_VISUALS: { match: RegExp; photo: string; waves?: boolean; position?: string }[] = [
  { match: /pēriens/i, photo: '64', position: '40% 30%' },
  { match: /vibro/i, photo: '4', waves: true, position: '60% 45%' },
  { match: /skrub/i, photo: '3', position: '50% 40%' },
];
const extraVisual = (name: string) => EXTRA_VISUALS.find((v) => v.match.test(name));

// Rings of vibration, spreading out from under the whisks and fading.
const Waves = () => (
  <svg aria-hidden viewBox="0 0 200 200" className="pp-waves absolute right-[18%] top-1/2 h-[150%] -translate-y-1/2" preserveAspectRatio="xMidYMid meet">
    {[0, 1, 2, 3].map((i) => (
      <circle key={i} cx="100" cy="100" r="34" fill="none" stroke="rgba(190,242,200,0.75)" strokeWidth="1.2" style={{ animationDelay: `${i * 0.9}s` }} />
    ))}
    <circle cx="100" cy="100" r="5" fill="rgba(190,242,200,0.55)" className="pp-waves-core" />
  </svg>
);

// "Procedūras Ilgums: 4 h" → ["Procedūras Ilgums", "4 h"].
const splitLabel = (text: string) => {
  const i = text.indexOf(':');
  return i > 0 ? [text.slice(0, i).trim(), text.slice(i + 1).trim()] : ['', text];
};
// "Pirts un zāļu kubla noma – 18€ /h (4 h iekļauta cenā)" → label and price.
const splitDash = (text: string) => {
  const i = text.indexOf('–');
  return i > 0 ? [text.slice(0, i).trim(), text.slice(i + 1).trim()] : [text, ''];
};

// Each party's ritual in the price list, picked in the booking form.
const PARTY_RITUAL: Record<ExperienceId, number> = { vecmeitas: 8, viru: 9 };

const PackagePanel: React.FC<{ id: ExperienceId }> = ({ id }) => {
  const book = () => openRitualBooking(priceCatalog.ritual[PARTY_RITUAL[id]]?.label);
  const { t } = useTranslation(id);
  const { t: tSpecial } = useTranslation('special');
  const name = tSpecial(NAME_KEY[id]);
  const descriptions = ['description1', 'description2', 'description3'].filter((k) => t(k, { defaultValue: '' }));
  const included = t('includedItems', { returnObjects: true }) as string[];
  const extras = t('additional.extraServices', { returnObjects: true }) as Extra[];
  const quoteLines = id === 'vecmeitas' ? ['poem.line1', 'poem.line2', 'poem.line3', 'poem.line4'].map((k) => t(k)) : [t('belief.text')];
  const quoteTitle = id === 'vecmeitas' ? t('poem.title') : t('belief.title');
  const [rentalLabel, rentalPrice] = splitDash(t('additional.rental'));

  return (
    <div className="space-y-16 sm:space-y-20">
      <style>{WAVES_CSS}</style>
      {/* The name, the price, and the folk song or saying. */}
      <div className="grid items-end gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-12">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-400">{t('title')}</p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">{name}</h2>
          <p className="mt-4 text-2xl font-semibold text-white">{t('price')}</p>
        </Reveal>
        <Reveal delay={0.1}>
          <figure className={`relative rounded-[1.75rem] p-6 sm:p-7 ${glassGreen}`}>
            <Quote aria-hidden className="absolute right-5 top-5 h-7 w-7 text-green-300/40" />
            <figcaption className="text-xs font-semibold uppercase tracking-[0.2em] text-green-300">{quoteTitle}</figcaption>
            <blockquote className="mt-3 text-lg italic leading-relaxed text-white/90">
              {quoteLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </blockquote>
          </figure>
        </Reveal>
      </div>

      {/* Photographs, story and essentials. */}
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <Reveal y={40}>
          <PhotoCarousel
            slides={PHOTOS[id].map((n) => `/media/events/gallery/${n}.webp`)}
            alt={name}
            frameClassName="aspect-[4/3] lg:aspect-auto lg:h-full lg:min-h-[32rem]"
          />
        </Reveal>
        <div>
          {descriptions.map((key, i) => (
            <Reveal key={key} delay={0.05 * i}>
              <p className="mb-5 text-lg leading-relaxed text-white/80">{t(key)}</p>
            </Reveal>
          ))}
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {(Object.keys(DETAIL_ICONS) as (keyof typeof DETAIL_ICONS)[]).map((key, i) => {
              const [label, value] = splitLabel(t(`details.${key}`));
              const Icon = DETAIL_ICONS[key];
              return (
                <Reveal key={key} delay={0.05 * i}>
                  <div className={`flex h-full items-start gap-3 rounded-2xl p-4 ${glass}`}>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-600/20 ring-1 ring-green-400/30">
                      <Icon aria-hidden className="h-5 w-5 text-green-300" />
                    </span>
                    <span>
                      <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-white/55">{label}</span>
                      <span className="mt-0.5 block text-base font-semibold text-white">{value}</span>
                    </span>
                  </div>
                </Reveal>
              );
            })}
          </div>
          <Reveal className="mt-8">
            <button type="button" onClick={book} className={primaryButton}>
              {t('cta.button')}
            </button>
          </Reveal>
        </div>
      </div>

      {/* What the programme includes, step by step. */}
      <div>
        <Reveal>
          <h3 className="text-center text-2xl font-bold text-white sm:text-3xl">{t('includedTitle')}</h3>
        </Reveal>
        <ol className="mt-10 grid gap-4 md:grid-cols-2">
          {included.map((item, i) => (
            <motion.li
              key={item}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.05 * (i % 2) }}
              className={`flex h-full gap-4 rounded-2xl p-5 sm:p-6 ${glass}`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white shadow-[0_8px_20px_-8px_rgba(34,197,94,0.8)]">
                {i + 1}
              </span>
              <p className="text-base leading-relaxed text-white/85">{item.replace(/;\s*$/, '')}</p>
            </motion.li>
          ))}
        </ol>
      </div>

      {/* Extras for the others in the party, the sauna rental, the night. */}
      <div>
        <Reveal>
          <h3 className="text-center text-2xl font-bold text-white sm:text-3xl">{t('additionalTitle')}</h3>
          <p className="mx-auto mt-3 max-w-2xl text-center text-base text-white/70">{t('additional.extraTitle')}</p>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {extras.map((extra, i) => {
            const visual = extraVisual(extra.name);
            return (
              <Reveal key={extra.name} delay={0.06 * i}>
                <SpotlightCard className="group/extra h-full" contentClassName="flex min-h-[9.5rem] flex-col justify-end p-6">
                  {visual && (
                    <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-[78%] overflow-hidden">
                      <img
                        src={`/media/events/gallery/${visual.photo}.webp`}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        style={{ objectPosition: visual.position }}
                        className="h-full w-full object-cover opacity-45 transition-[opacity,transform] duration-[1200ms] ease-out [mask-image:linear-gradient(to_left,black_20%,transparent_96%)] group-hover/extra:scale-105 group-hover/extra:opacity-60"
                      />
                      {visual.waves && <Waves />}
                    </div>
                  )}
                  <p className="relative text-3xl font-bold tracking-tight text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.6)]">{extra.price}</p>
                  <p className="relative mt-2 max-w-[14rem] text-base text-white/85 first-letter:uppercase [text-shadow:0_1px_10px_rgba(0,0,0,0.7)]">{extra.name}</p>
                </SpotlightCard>
              </Reveal>
            );
          })}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Reveal>
            <div className={`flex h-full items-center justify-between gap-4 rounded-2xl p-5 ${glass}`}>
              <span className="text-base text-white/80">{rentalLabel}</span>
              <span className="text-right text-base font-semibold text-white">{rentalPrice}</span>
            </div>
          </Reveal>
          <Reveal delay={0.06}>
            <div className={`flex h-full items-center justify-between gap-4 rounded-2xl p-5 ${glass}`}>
              <span className="inline-flex items-center gap-2 text-base text-white/80">
                <BedDouble aria-hidden className="h-5 w-5 text-green-300" />
                {t('additional.accommodation')}
              </span>
              <span className="text-right text-base font-semibold text-white">{t('additional.accommodationPrice')}</span>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Booking. */}
      <Reveal>
        <div className={`relative overflow-hidden rounded-[2rem] p-8 text-center sm:p-12 ${glassGreen}`}>
          <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-green-500/20 blur-3xl" />
          <h3 className="relative text-2xl font-bold text-white sm:text-3xl">{t('cta.title')}</h3>
          <p className="relative mx-auto mt-3 max-w-xl text-lg text-white/80">{t('cta.subtitle')}</p>
          <button type="button" onClick={book} className={`relative mt-7 ${primaryButton}`}>
            {t('cta.button')}
          </button>
        </div>
      </Reveal>
    </div>
  );
};

const WAVES_CSS = `
.pp-waves circle:not(.pp-waves-core) { transform-origin: 100px 100px; animation: pp-wave 3.6s cubic-bezier(0.2, 0.6, 0.35, 1) infinite; opacity: 0; }
.pp-waves-core { animation: pp-core 1.8s ease-in-out infinite; }
@keyframes pp-wave { 0% { transform: scale(0.35); opacity: 0; } 15% { opacity: 0.9; } 100% { transform: scale(2.6); opacity: 0; } }
@keyframes pp-core { 0%, 100% { opacity: 0.35; } 50% { opacity: 0.8; } }
@media (prefers-reduced-motion: reduce) {
  .pp-waves circle:not(.pp-waves-core) { animation: none; opacity: 0.35; }
  .pp-waves circle:nth-child(2) { transform: scale(1.5); }
  .pp-waves circle:nth-child(3) { transform: scale(2.1); opacity: 0.2; }
  .pp-waves circle:nth-child(4) { display: none; }
  .pp-waves-core { animation: none; }
}
`;

export default PackagePanel;
