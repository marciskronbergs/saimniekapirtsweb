import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const VideoSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation('rituali-preview');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-12 sm:py-16 md:py-24 bg-black relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Video Section */}
          <div className={`transform transition-all duration-1000 ${
            isVisible ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'
          }`}>
            <div className="relative rounded-xl overflow-hidden mb-6 lg:mb-0">
              {/* Video Player */}
              <div className="relative aspect-video bg-gray-900">
                <video
                  className="w-full h-full object-cover"
                  poster="https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/hero/13.png"
                  controls={false}
                  preload="metadata"
                >
                  <source 
                    src="https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/video/Pilns_pirts_rituals.mp4" 
                    type="video/mp4" 
                  />
                  Your browser does not support the video tag.
                </video>
                
                {/* Custom Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <button 
                    className="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110"
                    style={{ backgroundColor: '#1a3d2e' }}
                    onClick={(e) => {
                      const video = e.currentTarget.parentElement?.previousElementSibling as HTMLVideoElement;
                      if (video) {
                        video.controls = true;
                        video.play();
                        e.currentTarget.parentElement!.style.display = 'none';
                      }
                    }}
                  >
                    <Play className="w-8 h-8 text-white ml-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className={`transform transition-all duration-1000 ${
            isVisible ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'
          }`} style={{ transitionDelay: '200ms' }}>
            <div className="mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-4 sm:mb-6 lg:mb-8">
                {t('title')}
              </h2>
            </div>

            <div className="mb-6 sm:mb-8 lg:mb-10">
              <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
                {t('description')}
              </p>
            </div>

            {/* Bullet Points */}
            <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 lg:mb-10">
              {t('features', { returnObjects: true }).map((point: string, index: number) => (
                <div
                  key={index}
                  className={`flex items-center gap-4 transform transition-all duration-500 ${
                    isVisible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
                  }`}
                  style={{ transitionDelay: `${400 + index * 100}ms` }}
                >
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-300 text-sm sm:text-base lg:text-lg">{point}</span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <Link 
              to="/pirts-rituali"
              className="inline-block w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white px-8 sm:px-10 py-4 rounded-xl text-base sm:text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25 text-center"
            >
              {t('cta')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VideoSection;