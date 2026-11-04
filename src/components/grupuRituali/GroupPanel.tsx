import { motion } from 'framer-motion';
import { BedDouble, Check, Home, Quote, Users, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PhotoCarousel from '../pirtsRituali/PhotoCarousel';
import { Reveal, SpotlightCard } from '../pirtsRituali/ritualUi';
import { EASE, glass, glassGreen, openRitualBooking, primaryButton } from '../pirtsRituali/ritualStyles';
import priceCatalog from '../../data/priceCatalog.json';
import { splitPrice, type GroupId } from './GroupTabs';

// One group ritual's programme, as it opens under the tabs (the Īpašie
// page's PackagePanel, for groups): the name and price with the folk belief,
// the photographs with the story and what is and is not included, the
// programme step by step, the extras, and the way to book. Content:
// groupRituals.json.

const GALLERY = '/media/rituals/gallery';
const PHOTOS: Record<GroupId, string[]> = {
  meistaru: ['31', '60', '61', '65'].map((n) => `${GALLERY}/${n}.webp`).concat('/media/rituals/group/slide-2.webp'),
  draugu: ['31', '2', '61', '65'].map((n) => `${GALLERY}/${n}.webp`).concat('/media/rituals/group/slide-3.webp'),
  'draugu-plus': ['31', '2', '3', '65'].map((n) => `${GALLERY}/${n}.webp`).concat('/media/rituals/group/slide-4.webp'),
};

// "Izsildīšanās – vienmērīga izsildīšanās …" → the name and the rest.
const splitDash = (text: string) => {
  const i = text.indexOf('–');
  return i > 0 ? [text.slice(0, i).trim(), text.slice(i + 1).trim()] : ['', text];
};

// Each group's ritual in the price list, picked in the booking form.
const GROUP_RITUAL: Record<GroupId, number> = { meistaru: 5, draugu: 6, 'draugu-plus': 7 };

const GroupPanel: React.FC<{ id: GroupId }> = ({ id }) => {
  const book = () => openRitualBooking(priceCatalog.ritual[GROUP_RITUAL[id]]?.label);
  const { t } = useTranslation('groupRituals');
  const k = (key: string) => `${id}.${key}`;
  const name = t(k('cardTitle'));
  const { amount, min } = splitPrice(t(k('price')));
  const features = t(k('features'), { returnObjects: true }) as string[];
  const included = t(k('includedItems'), { returnObjects: true }) as string[];
  const extraWhisking = id === 'meistaru';

  return (
    <div className="space-y-16 sm:space-y-20">
      {/* The name, the price, and the folk belief. */}
      <div className="grid items-end gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-12">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-400">{t(k('title'))}</p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">{name}</h2>
          <p className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="text-2xl font-semibold text-white">{amount}</span>
            {min && <span className="text-base text-white/60">{min}</span>}
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <figure className={`relative rounded-[1.75rem] p-6 sm:p-7 ${glassGreen}`}>
            <Quote aria-hidden className="absolute right-5 top-5 h-7 w-7 text-green-300/40" />
            <figcaption className="text-xs font-semibold uppercase tracking-[0.2em] text-green-300">{t('ticējums.title').replace(/:$/, '')}</figcaption>
            <blockquote className="mt-3 text-lg italic leading-relaxed text-white/90">{t('ticējums.text')}</blockquote>
          </figure>
        </Reveal>
      </div>

      {/* Photographs, story, and what is and is not included. */}
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <Reveal y={40}>
          <PhotoCarousel slides={PHOTOS[id]} alt={name} frameClassName="aspect-[4/3] lg:aspect-auto lg:h-full lg:min-h-[32rem]" />
        </Reveal>
        <div>
          <Reveal>
            <p className="text-lg leading-relaxed text-white/80">{t(k('description'))}</p>
          </Reveal>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {features.map((feature, i) => {
              const no = feature.startsWith('❌');
              const text = feature.replace(/^❌\s*/, '');
              return (
                <Reveal key={feature} delay={0.05 * i}>
                  <li className={`flex h-full items-center gap-3 rounded-2xl p-4 ${glass} ${no ? 'opacity-60' : ''}`}>
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${
                        no ? 'bg-white/[0.06] ring-white/15' : 'bg-green-600/20 ring-green-400/30'
                      }`}
                    >
                      {no ? <X aria-hidden className="h-4 w-4 text-white/60" /> : <Check aria-hidden className="h-4 w-4 text-green-300" />}
                    </span>
                    <span className="min-w-0">
                      <span className="sr-only">{no ? t('ui.notIncluded') : t('ui.included')}: </span>
                      <span className={`text-base font-medium ${no ? 'text-white/70 line-through decoration-white/30' : 'text-white'}`}>{text}</span>
                    </span>
                  </li>
                </Reveal>
              );
            })}
          </ul>
          <Reveal className="mt-8">
            <button type="button" onClick={book} className={primaryButton}>
              {t(k('ctaButton'))}
            </button>
          </Reveal>
        </div>
      </div>

      {/* The programme, step by step. */}
      <div>
        <Reveal>
          <h3 className="text-center text-2xl font-bold text-white sm:text-3xl">{t(k('includedTitle')).replace(/:$/, '')}</h3>
        </Reveal>
        <ol className="mt-10 grid gap-4 md:grid-cols-2">
          {included.map((item, i) => {
            const [label, text] = splitDash(item);
            return (
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
                <p className="text-base leading-relaxed text-white/80">
                  {label && <span className="block text-lg font-semibold text-white">{label}</span>}
                  {text}
                </p>
              </motion.li>
            );
          })}
        </ol>
      </div>

      {/* The extras: the rental, an extra whisking, the night. */}
      <div>
        <Reveal>
          <h3 className="text-center text-2xl font-bold text-white sm:text-3xl">{t(k('additionalTitle')).replace(/:$/, '')}</h3>
        </Reveal>
        <div className={`mt-10 grid gap-4 ${extraWhisking ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
          <Reveal>
            <SpotlightCard className="h-full" contentClassName="flex h-full items-start gap-4 p-6">
              <Home aria-hidden className="mt-1 h-6 w-6 shrink-0 text-green-300" />
              <p className="text-base leading-relaxed text-white/85">{t(k('additionalRental'))}</p>
            </SpotlightCard>
          </Reveal>
          {extraWhisking && (
            <Reveal delay={0.06}>
              <SpotlightCard className="h-full" contentClassName="p-6">
                <p className="text-3xl font-bold tracking-tight text-white">{t(k('additionalPeriensPrice'))}</p>
                <p className="mt-2 text-base text-white/80">{t(k('additionalPeriensTitle')).replace(/:$/, '')}</p>
              </SpotlightCard>
            </Reveal>
          )}
          <Reveal delay={0.12}>
            <SpotlightCard className="h-full" contentClassName="p-6">
              <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-green-300">
                <BedDouble aria-hidden className="h-4 w-4" />
                {t(k('accommodationTitle'))}
              </p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-white">{t(k('accommodationPrice'))}</p>
              <p className="mt-1 text-base text-white/70">{t(k('accommodationNote'))}</p>
            </SpotlightCard>
          </Reveal>
        </div>
      </div>

      {/* Booking. */}
      <Reveal>
        <div className={`relative overflow-hidden rounded-[2rem] p-8 text-center sm:p-12 ${glassGreen}`}>
          <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-green-500/20 blur-3xl" />
          <Users aria-hidden className="relative mx-auto h-10 w-10 text-green-300" strokeWidth={1.6} />
          <h3 className="relative mt-4 text-2xl font-bold text-white sm:text-3xl">{t(k('ctaTitle'))}</h3>
          <p className="relative mx-auto mt-3 max-w-xl text-lg text-white/80">{t(k('ctaSubtitle'))}</p>
          <button type="button" onClick={book} className={`relative mt-7 ${primaryButton}`}>
            {t(k('ctaButton'))}
          </button>
        </div>
      </Reveal>
    </div>
  );
};

export default GroupPanel;
