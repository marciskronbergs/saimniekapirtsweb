import React, { useEffect, useRef, useState } from 'react';
import { Check, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import RitualVideoCarousel from '../ritualVideos/RitualVideoCarousel';
import { MAIN_VIDEO, ritualVideos } from '../ritualVideos/ritualVideos';
import { openInlineRitualBooking } from '../booking/InlineBooking';

// "Tradicionālais Pirts Rituāls": the homepage's glass video coverflow on the
// left, the story of the ritual and the way to book it on the right.

const RitualIntro = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation('rituali');
  const { t: tVideos } = useTranslation('rituali-preview');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const titles = tVideos('videos.items', { returnObjects: true }) as { title: string; subtitle?: string }[];
  const videos = ritualVideos.map((video, i) => ({ ...video, ...(Array.isArray(titles) ? titles[i] : { title: '' }) }));

  return (
    <section ref={sectionRef} className="relative py-20 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* A low green glow behind the videos. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-full md:w-3/5"
        style={{ background: 'radial-gradient(55% 45% at 50% 55%, rgba(34,197,94,0.12), transparent 70%)' }}
      />

      <div className="relative flex flex-col md:flex-row items-center gap-12 lg:gap-16">
        {/* Left: the ritual videos */}
        <div
          className={`w-full md:w-[55%] transition-all duration-1000 motion-reduce:transition-none ${
            isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0 motion-reduce:translate-x-0 motion-reduce:opacity-100'
          }`}
        >
          <RitualVideoCarousel
            fit
            items={videos}
            initialIndex={MAIN_VIDEO}
            labels={{
              region: tVideos('videos.region'),
              play: (title) => tVideos('videos.play', { title }),
              pause: (title) => tVideos('videos.pause', { title }),
              soon: tVideos('videos.soon'),
            }}
          />
        </div>

        {/* Right: Content */}
        <div
          className={`w-full md:w-[45%] text-center md:text-left transition-all delay-150 duration-1000 motion-reduce:transition-none ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100'
          }`}
        >
          {/* Title */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6">
            {t('intro.title')}
          </h2>

          {/* 5-Star Rating */}
          <div className="flex justify-center md:justify-start gap-1 mb-6">
            {[...Array(5)].map((_, index) => (
              <Star key={index} className="w-6 h-6 text-yellow-400 fill-current" />
            ))}
          </div>

          {/* Italic Subheading */}
          <p className="text-xl text-gray-300 italic font-light mb-8 opacity-90">
            {t('intro.quote')}
          </p>

          {/* Description Paragraph */}
          <p className="text-lg text-white mb-10 leading-relaxed">
            {t('intro.description')}
          </p>

          {/* Checklist */}
          <div className="space-y-4 mb-10 text-left">
            {(t('intro.features', { returnObjects: true }) as string[]).map((item, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-gray-300 text-lg">{item}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <button
            onClick={() => openInlineRitualBooking()}
            className="bg-green-600 hover:bg-green-500 text-white px-10 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25 cursor-pointer"
          >
            {t('intro.cta')}
          </button>
        </div>
      </div>
    </section>
  );
};

export default RitualIntro;
