import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const SaunaHost = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [yearsCount, setYearsCount] = useState(0);
  const [ritualsCount, setRitualsCount] = useState(0);
  const sectionRef = React.useRef<HTMLDivElement>(null);
  const { t } = useTranslation('rituali');

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

  // Animate counters when visible
  useEffect(() => {
    if (isVisible) {
      // Animate years counter
      const yearsInterval = setInterval(() => {
        setYearsCount(prev => {
          if (prev >= 7) {
            clearInterval(yearsInterval);
            return 7;
          }
          return prev + 1;
        });
      }, 200);

      // Animate rituals counter
      const ritualsInterval = setInterval(() => {
        setRitualsCount(prev => {
          if (prev >= 1500) {
            clearInterval(ritualsInterval);
            return 1500;
          }
          return prev + 50;
        });
      }, 50);

      return () => {
        clearInterval(yearsInterval);
        clearInterval(ritualsInterval);
      };
    }
  }, [isVisible]);

  // Static main image (first image from the original array)
  const mainImage = 'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/pirtnieki/70.png';
  
  // Three additional images for desktop static display / mobile carousel
  const additionalImages = [
    'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/pirtnieki/67.png',
    'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/pirtnieki/68.png',
    'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/Your%20paragraph%20text%20(3).png'
  ];

  return (
    <section 
      ref={sectionRef}
      className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 max-w-7xl mx-auto overflow-x-hidden"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-16 items-center mb-12 sm:mb-16">
        {/* Left: Main Static Image */}
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'
        }`}>
          <div className="relative rounded-2xl overflow-hidden mb-8 lg:mb-0">
            <img
              src={mainImage}
              alt="Pirts Saimnieks Mārcis Kronbergs"
              className="w-full h-[250px] sm:h-[300px] lg:h-[400px] object-cover transition-all duration-500"
            />
          </div>
        </div>

        {/* Right: Content */}
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'
        }`}>
          <h2 className="text-xl sm:text-2xl lg:text-4xl xl:text-5xl font-bold text-white mb-6 sm:mb-8 break-words">
            {t('saunaHost.title')}
          </h2>
          
          <p className="text-sm sm:text-base lg:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed break-words">
            {t('saunaHost.description')}
          </p>

          {/* Animated Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="text-center md:text-left">
              <div className="text-xl sm:text-2xl lg:text-4xl font-bold text-green-400 mb-2">
                {t('saunaHost.stats.0.number').replace('+', '')}+
              </div>
              <div className="text-white font-semibold mb-2 text-xs sm:text-sm lg:text-base break-words">{t('saunaHost.stats.0.title')}</div>
              <div className="text-xs text-gray-400 leading-relaxed break-words">
                {t('saunaHost.stats.0.description')}
              </div>
            </div>
            
            <div className="text-center md:text-left">
              <div className="text-xl sm:text-2xl lg:text-4xl font-bold text-green-400 mb-2">
                {t('saunaHost.stats.1.number').replace('+', '')}+
              </div>
              <div className="text-white font-semibold mb-2 text-xs sm:text-sm lg:text-base break-words">{t('saunaHost.stats.1.title')}</div>
              <div className="text-xs text-gray-400 leading-relaxed break-words">
                {t('saunaHost.stats.1.description')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: Three Static Images Side by Side */}
      <div className={`hidden md:flex justify-center gap-6 transform transition-all duration-1000 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
      }`} style={{ transitionDelay: '400ms' }}>
        {additionalImages.map((image, index) => (
          <div
            key={index}
            className="w-[140px] lg:w-[180px] h-[140px] lg:h-[180px] rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <img
              src={image}
              alt={`Pirts Saimnieks ${index + 2}`}
              className="w-full h-full object-cover transition-all duration-300 hover:brightness-110"
            />
          </div>
        ))}
      </div>

      {/* Mobile: Horizontal Scrollable Carousel with smaller cards */}
      <div className={`md:hidden transform transition-all duration-1000 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
      }`} style={{ transitionDelay: '400ms' }}>
        <div className="flex overflow-x-auto space-x-3 pb-4 scrollbar-hide px-1">
          {additionalImages.map((image, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-[100px] h-[100px] rounded-lg overflow-hidden shadow-lg"
            >
              <img
                src={image}
                alt={`Pirts Saimnieks ${index + 2}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
};

export default SaunaHost;