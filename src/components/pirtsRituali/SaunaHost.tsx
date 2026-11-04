import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CountUp, Reveal, SectionHeading, SpotlightCard } from './ritualUi';
import { EASE, glass } from './ritualStyles';

// "Pirts Saimnieks": the host's portrait in a glass frame with his name on
// it, his story and two numbers that count up, and the sauna masters
// beside him. Photos: public/media/rituals/host/, WebP copies of the
// Supabase pirtnieki/70, 67, 68 and bildes/"Your paragraph text (3)".

const HOST = '/media/rituals/host';
const TEAM = ['host67', 'host68', 'host-extra'];

interface Stat {
  number: string;
  title: string;
  description: string;
}

const SaunaHost = () => {
  const { t } = useTranslation('rituali');
  const { t: tCommon } = useTranslation('common');
  const stats = t('saunaHost.stats', { returnObjects: true }) as Stat[];

  return (
    <section aria-labelledby="host-heading" className="relative px-4 py-20 sm:px-6 sm:py-24 lg:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <Reveal y={40} className="relative mx-auto w-full max-w-xl">
          <div className={`rounded-[2rem] p-2.5 ${glass}`}>
            <div className="relative aspect-square overflow-hidden rounded-[1.5rem]">
              <img
                src={`${HOST}/host-main.webp`}
                alt={tCommon('imageAlt.host')}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.3 }}
            className={`absolute -bottom-5 left-6 right-6 rounded-2xl px-5 py-4 sm:left-auto sm:right-8 sm:w-auto ${glass}`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-300">{t('saunaHost.title')}</p>
            <p className="mt-0.5 text-lg font-semibold text-white">Mārcis Kronbergs</p>
          </motion.div>
        </Reveal>

        <div className="pt-6 lg:pt-0">
          <SectionHeading id="host-heading" align="left" eyebrow={t('ui.hostEyebrow')} title={t('saunaHost.title')} />
          <Reveal delay={0.1}>
            <p className="mt-6 text-lg leading-relaxed text-white/80">{t('saunaHost.description')}</p>
          </Reveal>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {stats.map((stat, i) => {
              const to = parseInt(stat.number.replace(/\D/g, ''), 10) || 0;
              const suffix = stat.number.replace(/[\d\s]/g, '');
              return (
                <Reveal key={stat.title} delay={0.15 + 0.08 * i}>
                  <SpotlightCard className="h-full" contentClassName="p-6">
                    <CountUp to={to} suffix={suffix} className="block text-4xl font-bold tracking-tight text-green-300" />
                    <p className="mt-2 text-base font-semibold text-white">{stat.title}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/65">{stat.description}</p>
                  </SpotlightCard>
                </Reveal>
              );
            })}
          </div>

          <Reveal delay={0.3} className="mt-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">{t('ui.team')}</p>
            <ul className="mt-4 flex gap-3 sm:gap-4">
              {TEAM.map((name, i) => (
                <li key={name} className={`w-24 overflow-hidden rounded-2xl p-1 transition-transform duration-500 hover:-translate-y-1 sm:w-28 ${glass}`}>
                  <img
                    src={`${HOST}/${name}.webp`}
                    alt={`${tCommon('imageAlt.hostExtra')} ${i + 2}`}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[4/5] w-full rounded-xl object-cover"
                  />
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default SaunaHost;
