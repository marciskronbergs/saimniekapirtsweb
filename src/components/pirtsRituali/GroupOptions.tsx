import { useNavigate } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TabType } from '../../pages/GrupuRitualiPage';
import { Reveal, SectionHeading, SpotlightCard } from './ritualUi';
import { primaryButton } from './ritualStyles';
import PhotoCarousel from './PhotoCarousel';

// "Grupu Pirts Rituāli": a carousel of group photographs in a glass frame,
// and beside it the three group options, each with its own photograph fading
// in behind it. What an option leaves out is listed plainly under it (the
// translations mark those with ❌, shown here as an icon instead).
//
// Photos: public/media/rituals/group/, WebP copies of the Supabase
// pirtnieki/grupu.png and bildes/61, 64, 62 (slides) and 65, 60, 31 (options).

const GROUP = '/media/rituals/group';
const SLIDES = [1, 2, 3, 4].map((n) => `${GROUP}/slide-${n}.webp`);
const TABS: TabType[] = ['meistaru', 'draugu', 'draugu-plus'];

interface Option {
  title: string;
  price: string;
  description: string;
  restrictions?: string[];
}

// "70€ /no personas" → "70€" and "/no personas".
const splitPrice = (price: string) => {
  const i = price.indexOf('/');
  return i > 0 ? { amount: price.slice(0, i).trim(), unit: price.slice(i).trim() } : { amount: price, unit: '' };
};

const GroupOptions = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('rituali');
  const { t: tCommon } = useTranslation('common');
  const options = t('groupOptions.options', { returnObjects: true }) as Option[];

  return (
    <section aria-labelledby="groups-heading" className="relative px-4 py-20 sm:px-6 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeading id="groups-heading" eyebrow={t('ui.groupEyebrow')} title={t('groupOptions.title')} />

        <div className="mt-14 grid gap-8 lg:mt-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10">
          <Reveal y={40}>
            <PhotoCarousel slides={SLIDES} alt={tCommon('imageAlt.group')} />
          </Reveal>

          <div className="flex flex-col gap-5">
            {options.map((option, i) => {
              const { amount, unit } = splitPrice(option.price);
              const missing = (option.restrictions ?? []).map((key) => t(`groupOptions.${key}`).replace(/^❌\s*/, ''));
              return (
                <Reveal key={option.title} delay={0.08 * i} y={32}>
                  <SpotlightCard className="group/opt" contentClassName="p-6 sm:p-7">
                    {/* The option's photograph, fading in from the right. */}
                    <div aria-hidden className="pointer-events-none absolute -inset-6 left-auto w-[62%] sm:-inset-7 sm:left-auto">
                      <img
                        src={`${GROUP}/option-${i + 1}.webp`}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover opacity-40 transition-[opacity,transform] duration-[1200ms] ease-out [mask-image:linear-gradient(to_left,black_15%,transparent_95%)] group-hover/opt:scale-105 group-hover/opt:opacity-55"
                      />
                    </div>
                    <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-7">
                      <div className="shrink-0 sm:w-32">
                        <p className="text-3xl font-bold tracking-tight text-white">{amount}</p>
                        {unit && <p className="mt-1 text-sm text-white/65">{unit}</p>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold uppercase leading-snug tracking-[0.08em] text-green-400">{option.title}</h3>
                        <p className="mt-2 max-w-md text-base leading-relaxed text-white/85">{option.description}</p>
                        {missing.length > 0 && (
                          <ul className="mt-4 flex flex-wrap gap-2" aria-label={t('ui.notIncluded')}>
                            {missing.map((item) => (
                              <li
                                key={item}
                                className="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-sm text-white/80 ring-1 ring-white/10 backdrop-blur-md"
                              >
                                <X aria-hidden className="h-3.5 w-3.5 text-red-400" />
                                <span className="sr-only">{t('ui.notIncluded')}: </span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        )}
                        <button
                          type="button"
                          onClick={() => navigate('/grupu-rituali', { state: { tab: TABS[i] } })}
                          className={`group mt-5 !px-5 !py-2.5 !text-sm ${primaryButton}`}
                        >
                          {t('groupOptions.cta')}
                          <ArrowRight aria-hidden className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </button>
                      </div>
                    </div>
                  </SpotlightCard>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default GroupOptions;
