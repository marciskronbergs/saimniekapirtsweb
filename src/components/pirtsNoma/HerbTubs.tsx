import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const HerbTubs = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation('noma');
  const { t: tCommon } = useTranslation('common');

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);

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

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Auto-rotation for desktop
  useEffect(() => {
    if (!isMobile && isVisible) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % tubImages.length);
      }, 4000); // 4 seconds per image

      return () => clearInterval(interval);
    }
  }, [isMobile, isVisible]);

  const tubImages = [
    'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/1.png',
    'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/29.png',
    'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/31.png',
    'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/33.png',
    'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/34.png'
  ];

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const startX = touch.clientX;
    
    const handleTouchMove = (moveEvent: TouchEvent) => {
      const currentTouch = moveEvent.touches[0];
      const diffX = startX - currentTouch.clientX;
      
      if (Math.abs(diffX) > 50) { // Minimum swipe distance
        if (diffX > 0) {
          // Swipe left - next image
          setCurrentImageIndex((prev) => (prev + 1) % tubImages.length);
        } else {
          // Swipe right - previous image
          setCurrentImageIndex((prev) => (prev + tubImages.length - 1) % tubImages.length);
        }
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      }
    };
    
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  };

  return (
    <section 
      ref={sectionRef}
      className="py-24 bg-black relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className={`text-center mb-16 transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-8">
            {t('herbTubs.title')}
          </h2>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            {t('herbTubs.description')}
          </p>
        </div>

        {/* Image Carousel */}
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          <div 
            className="relative rounded-2xl overflow-hidden group cursor-pointer"
            onDragStart={handleDragStart}
            onTouchStart={isMobile ? handleTouchStart : undefined}
          >
            {/* Images */}
            {tubImages.map((image, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                  index === currentImageIndex 
                    ? 'opacity-100 scale-100' 
                    : 'opacity-0 scale-105'
                }`}
              >
                <img
                  src={image}
                  alt={`${tCommon('imageAlt.herbTub')} ${index + 1}`}
                  className="w-full h-64 md:h-80 object-cover group-hover:scale-110 transition-transform duration-700"
                  draggable={false}
                />
              </div>
            ))}
            
            {/* First image for layout */}
            <img
              src={tubImages[0]}
              alt={tCommon('imageAlt.herbTub')}
              className="w-full h-64 md:h-80 object-cover opacity-0"
              draggable={false}
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          </div>
          
          {/* Mobile Navigation Dots */}
          {isMobile && (
            <div className="flex justify-center gap-2 mt-6">
              {tubImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-8 h-8 rounded-full transition-all duration-300 cursor-pointer ${
                    index === currentImageIndex 
                      ? 'bg-green-500 shadow-lg shadow-green-500/50 scale-110 ring-2 ring-white/30' 
                      : 'bg-gray-500 hover:bg-gray-400 border border-white/20'
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HerbTubs;