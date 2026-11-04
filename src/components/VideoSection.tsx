import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import RitualVideoCarousel from './ritualVideos/RitualVideoCarousel';
import { MAIN_VIDEO, ritualVideos } from './ritualVideos/ritualVideos';

// "Latviskais Pirts Rituāls": the ritual told in three short upright videos
// in a glass coverflow, and the way in below.

const VideoSection = () => {
  const { t } = useTranslation('rituali-preview');
  const sectionRef = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const titles = t('videos.items', { returnObjects: true }) as { title: string; subtitle?: string }[];
  const items = ritualVideos.map((video, i) => ({ ...video, ...(Array.isArray(titles) ? titles[i] : { title: '' }) }));

  return (
    <section ref={sectionRef} aria-labelledby="ritual-videos-heading" className="relative overflow-hidden py-16 sm:py-20 lg:py-28">
      {/* A low green glow behind the deck. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(55% 45% at 50% 55%, rgba(34,197,94,0.14), transparent 70%)' }}
      />

      <div
        className={`relative mx-auto max-w-3xl px-4 text-center transition-all duration-1000 motion-reduce:transition-none ${
          shown ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100'
        }`}
      >
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.22em] text-green-400">{t('videos.eyebrow')}</p>
        <h2 id="ritual-videos-heading" className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
          {t('title')}
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg leading-relaxed text-gray-300">{t('description')}</p>
      </div>

      <div
        className={`relative mt-10 sm:mt-14 transition-all delay-150 duration-1000 motion-reduce:transition-none ${
          shown ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100'
        }`}
      >
        <RitualVideoCarousel
          items={items}
          initialIndex={MAIN_VIDEO}
          labels={{
            region: t('videos.region'),
            play: (title) => t('videos.play', { title }),
            pause: (title) => t('videos.pause', { title }),
            soon: t('videos.soon'),
          }}
        />
      </div>

      <div className="relative mx-auto mt-8 sm:mt-10 flex justify-center px-4">
        <Link
          to="/pirts-rituali"
          className="inline-flex items-center rounded-full bg-green-600 px-9 py-4 text-lg font-semibold text-white shadow-[0_12px_32px_-12px_rgba(34,197,94,0.8),inset_0_1px_0_rgba(255,255,255,0.35)] transition-colors hover:bg-green-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-green-300/60"
        >
          {t('cta')}
        </Link>
      </div>
    </section>
  );
};

export default VideoSection;
