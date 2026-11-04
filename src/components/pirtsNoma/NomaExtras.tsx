import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { eyebrow, glassChip, glassPanel, nomaPhoto, nomaSrcSet, rise, useShown } from './glass';

// The extras to a rental (whisks, scrubs) as glass cards: a photo with the
// price on a glass chip, the second photo fading in on hover, the words and
// what is included below.

interface Extra {
  title: string;
  price: string;
  description: string;
  features: string[];
}

const PHOTOS = [
  ['43', '44'],
  ['46', '47'],
];

const NomaExtras = () => {
  const { t } = useTranslation('noma');
  const [ref, shown] = useShown<HTMLElement>(0.2);
  const extras = t('additionalServices.services', { returnObjects: true }) as Extra[];

  return (
    <section ref={ref} aria-labelledby="extras-heading" className="relative py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className={`${eyebrow} ${rise(shown).className}`}>{t('page.extrasEyebrow')}</p>
          <h2
            id="extras-heading"
            style={rise(shown, 80).style}
            className={`mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl ${rise(shown, 80).className}`}
          >
            {t('additionalServices.title')}
          </h2>
        </div>

        <div className="mt-10 grid gap-5 sm:mt-12 md:grid-cols-2 lg:gap-6">
          {Array.isArray(extras) &&
            extras.map((extra, i) => {
              const [first, second] = PHOTOS[i] ?? PHOTOS[0];
              return (
                <article
                  key={extra.title}
                  style={rise(shown, 160 + i * 120).style}
                  className={`group relative overflow-hidden rounded-[2rem] p-3 transition-shadow duration-500 hover:shadow-[0_30px_80px_-30px_rgba(34,197,94,0.5)] ${glassPanel} ${rise(shown, 160 + i * 120).className}`}
                >
                  <div className="relative h-60 overflow-hidden rounded-[1.5rem] bg-neutral-900 sm:h-72">
                    {[first, second].map((n, k) => (
                      <img
                        key={n}
                        src={nomaPhoto(n)}
                        srcSet={nomaSrcSet(n)}
                        sizes="(min-width: 768px) 45vw, 92vw"
                        alt={k === 0 ? extra.title : ''}
                        aria-hidden={k === 1 || undefined}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none ${
                          k === 1 ? 'opacity-0 group-hover:opacity-100' : ''
                        }`}
                      />
                    ))}
                    <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <span className={`absolute left-4 top-4 rounded-full px-4 py-2 text-xl font-bold text-white ${glassChip}`}>{extra.price}</span>
                  </div>
                  <div className="p-4 sm:p-6">
                    <h3 className="text-2xl font-bold text-white">{extra.title}</h3>
                    <p className="mt-2 leading-relaxed text-white/70">{extra.description}</p>
                    <ul className="mt-5 flex flex-wrap gap-2">
                      {extra.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 rounded-full bg-white/[0.07] px-3.5 py-2 text-sm text-white/85 ring-1 ring-white/15">
                          <Check className="h-4 w-4 text-green-400" aria-hidden />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              );
            })}
        </div>
      </div>
    </section>
  );
};

export default NomaExtras;
