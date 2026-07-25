import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PirtsNomaSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentImageIndices, setCurrentImageIndices] = useState<number[]>([0, 0]);
  const sectionRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation('noma');

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

  const saunas = t('saunas', { returnObjects: true }).map((sauna: any, index: number) => ({
    ...sauna,
    checklist: sauna.checklist,
    images: index === 0 ? [
      'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/15.png',
      'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/16.png',
      'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/17.png',
      'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/18.png',
      'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/19.png',
      'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/20.png',
      'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/21.png',
      'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/38.png'
    ] : [
      'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/23.png',
      'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/24.png',
      'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/25.png',
      'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/26.png',
      'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/27.png',
      'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/29.png',
      'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/40.png',
      'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/41.png'
    ]
  }));

  const handleImageNavigation = (saunaIndex: number, direction: 'prev' | 'next') => {
    setCurrentImageIndices(prev => {
      const newIndices = [...prev];
      const currentIndex = newIndices[saunaIndex];
      const totalImages = saunas[saunaIndex].images.length;
      
      if (direction === 'prev') {
        newIndices[saunaIndex] = (currentIndex + totalImages - 1) % totalImages;
      } else {
        newIndices[saunaIndex] = (currentIndex + 1) % totalImages;
      }
      
      return newIndices;
    });
  };

  const setImageIndex = (saunaIndex: number, imageIndex: number) => {
    setCurrentImageIndices(prev => {
      const newIndices = [...prev];
      newIndices[saunaIndex] = imageIndex;
      return newIndices;
    });
  };

  return (
    <section ref={sectionRef} className="py-24 bg-black relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Title and Subtitle */}
        <div className={`text-center mb-20 transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          <h2 className="text-4xl lg:text-6xl font-bold text-white mb-8">
            {t('section.title')}
          </h2>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            {t('section.description')}
          </p>
        </div>

        {/* Two Sauna Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {saunas.map((sauna, saunaIndex) => (
            <div
              key={saunaIndex}
              className={`group bg-[#132d13] rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-green-500/20 hover:bg-[#1a3d2e] ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
              }`}
              style={{ transitionDelay: `${saunaIndex * 200}ms` }}
            >
              {/* Image Carousel */}
              <div className="relative h-80 overflow-hidden">
                {/* Images */}
                {sauna.images.map((image, imageIndex) => (
                  <div
                    key={imageIndex}
                    className={`absolute inset-0 transition-all duration-700 ${
                      imageIndex === currentImageIndices[saunaIndex] 
                        ? 'opacity-100 scale-100' 
                        : 'opacity-0 scale-105'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${sauna.title} ${imageIndex + 1}`}
                      className="w-full h-full object-cover group-hover:contrast-110 transition-all duration-500"
                    />
                  </div>
                ))}
                
                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>

                {/* Navigation Arrows - Vertically Centered */}
                <button
                  onClick={() => handleImageNavigation(saunaIndex, 'prev')}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                
                <button
                  onClick={() => handleImageNavigation(saunaIndex, 'next')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Glowing Pagination Dots - Centered Below Carousel */}
              <div className="flex justify-center gap-2 md:gap-3 py-4 bg-[#132d13]">
                {sauna.images.map((_, imageIndex) => (
                  <button
                    key={imageIndex}
                    onClick={() => setImageIndex(saunaIndex, imageIndex)}
                    className={`w-8 h-8 md:w-3 md:h-3 rounded-full transition-all duration-300 cursor-pointer ${
                      imageIndex === currentImageIndices[saunaIndex] 
                        ? 'bg-green-500 shadow-lg shadow-green-500/50 scale-110 md:scale-125 ring-2 ring-white/30' 
                        : 'bg-gray-500 hover:bg-gray-400 hover:scale-110 border border-white/20'
                    }`}
                    aria-label={`Go to image ${imageIndex + 1}`}
                  />
                ))}
              </div>

              {/* Content */}
              <div className="p-8">
                <h3 className="text-3xl font-bold text-white mb-4">
                  {sauna.title}
                </h3>
                
                <p className="text-gray-300 text-lg leading-relaxed mb-8">
                  {sauna.description}
                </p>

                {/* Checklist */}
                <div className="space-y-4">
                  {sauna.checklist.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3"
                    >
                      <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-gray-300 leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className={`text-center mt-16 transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`} style={{ transitionDelay: '600ms' }}>
          <button 
            onClick={() => (window as any).openCustomPopup?.('noma')}
            className="bg-green-600 hover:bg-green-500 text-white px-12 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25 cursor-pointer"
          >
            {t('section.cta')}
          </button>
        </div>
      </div>
    </section>
  );
};

export default PirtsNomaSection;