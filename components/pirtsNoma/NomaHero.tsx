import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const NomaHero = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { t } = useTranslation('noma');

  const heroImageUrl = 'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/hero/noma-min.png';
  const fallbackImageUrl = 'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/hero/noma-min.png';

  useEffect(() => {
    setIsVisible(true);
    
    // Preload the image for fast loading
    const img = new Image();
    img.onload = () => {
      setImageLoaded(true);
    };
    img.onerror = () => {
      // If main image fails, try fallback
      const fallbackImg = new Image();
      fallbackImg.onload = () => {
        setImageLoaded(true);
      };
      fallbackImg.onerror = () => {
        // If both fail, still show content
        setImageLoaded(true);
      };
      fallbackImg.src = fallbackImageUrl;
    };
    img.src = heroImageUrl;
  }, []);

  const backgroundImageUrl = imageLoaded ? heroImageUrl : fallbackImageUrl;

  return (
    <section className="relative h-[60vh] sm:h-[65vh] md:h-[75vh] flex items-center justify-center flex-col text-center overflow-hidden">
      {/* Solid Black Background */}
      <div className="absolute inset-0 z-0 bg-black">
        {/* Background Image with fast loading */}
        <div
  className={`absolute inset-0 w-full h-full zoom-anim transition-opacity duration-500 ${
    imageLoaded ? 'opacity-100' : 'opacity-0'
  }`}
  style={{
    backgroundImage: `url(${heroImageUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    willChange: 'transform',
  }}
/>
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/60 z-10"></div>
      </div>

      {/* Content */}
      <div className="relative z-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className={`transform transition-all duration-800 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            <span className="text-white drop-shadow-lg">{t('hero.title')}</span>
            <br />
            <span className="text-[#22c55e] drop-shadow-lg">{t('hero.subtitle')}</span>
          </h1>
        </div>
      </div>

      {/* Scroll Indicator Arrow */}
      <div className={`absolute bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2 z-20 transition-all duration-800 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`} style={{ transitionDelay: '200ms' }}>
        <div className="animate-bounce">
          <ChevronDown className="w-6 h-6 sm:w-8 sm:h-8 text-[#22c55e] opacity-80" />
        </div>
      </div>

      {/* Optimized CSS for zoom animation */}
      <style jsx>{`
        @keyframes zoom {
          from { transform: scale(1); }
          to { transform: scale(1.05); }
        }
        .zoom-anim {
          animation: zoom 20s ease-in-out infinite alternate;
        }
      `}</style>
    </section>
  );
};

export default NomaHero;