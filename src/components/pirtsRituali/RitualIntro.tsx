import React, { useEffect, useRef, useState } from 'react';
import { Check, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const RitualIntro = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
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

  const images = [
    'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/4.png',
    'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/3.png',
    'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/13.png'
  ];

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev + images.length - 1) % images.length);
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <section 
      ref={sectionRef}
      className="py-20 px-4 sm:px-6 max-w-7xl mx-auto overflow-x-hidden"
    >
      <div className={`md:flex justify-between items-center gap-8 lg:gap-16 transform transition-all duration-1000 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
      }`}>
        {/* Left: Content */}
        <div className="w-full md:w-1/2 mb-12 md:mb-0">
          {/* Title */}
          <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white mb-6">
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
          <div className="space-y-4 mb-10">
            {t('intro.features', { returnObjects: true }).map((item: string, index: number) => (
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
            onClick={() => (window as any).openCustomPopup?.('ritual')}
            className="bg-green-600 hover:bg-green-500 text-white px-10 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25 cursor-pointer"
          >
            {t('intro.cta')}
          </button>
        </div>

        {/* Right: Image Carousel */}
        <div className="w-full md:w-1/2">
          <div className="relative rounded-2xl overflow-hidden">
            {/* Images */}
            {images.map((image, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-500 ${
                  index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <img
                  src={image}
                  alt={`Tradicionālais Pirts Rituāls ${index + 1}`}
                  className="w-full h-[300px] sm:h-[400px] object-cover"
                />
              </div>
            ))}
            
            {/* First image for layout */}
            <img
              src={images[0]}
              alt="Tradicionālais Pirts Rituāls"
              className="w-full h-[300px] sm:h-[400px] object-cover opacity-0"
            />

            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>

            {/* Navigation Arrows - Vertically Centered */}
            <button
              onClick={handlePrevImage}
              className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-all duration-300"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </button>
            
            <button
              onClick={handleNextImage}
              className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-all duration-300"
              aria-label="Next image"
            >
              <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </button>
          </div>

          {/* Glowing Indicator Dots - Below Image */}
          <div className="flex justify-center gap-2 mt-4">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 cursor-pointer ${
                  index === currentImageIndex 
                    ? 'bg-green-500 shadow-lg shadow-green-500/50 scale-125 ring-2 ring-white/30' 
                    : 'bg-gray-500 hover:bg-gray-400 border border-white/20'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RitualIntro;