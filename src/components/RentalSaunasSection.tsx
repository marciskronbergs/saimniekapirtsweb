import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const RentalSaunasSection = () => {
  const [visibleCards, setVisibleCards] = useState<boolean[]>([false, false, false]);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Image carousel states for each sauna
  const [currentImageIndices, setCurrentImageIndices] = useState<number[]>([0, 0, 0]);
  const { t } = useTranslation('rental');

  useEffect(() => {
    const observers = cardsRef.current.map((card, index) => {
      if (!card) return null;
      
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setVisibleCards(prev => {
                const newState = [...prev];
                newState[index] = true;
                return newState;
              });
            }
          });
        },
        { threshold: 0.3 }
      );
      
      observer.observe(card);
      return observer;
    });

    return () => {
      observers.forEach((observer) => observer?.disconnect());
    };
  }, []);

  const saunas = [
    {
      title: t('baltaPirts.title'),
      description: t('baltaPirts.description'),
      images: [
        'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/15.png',
        'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/17.png'
      ],
      delay: '0ms'
    },
    {
      title: t('pelekaPirts.title'),
      description: t('pelekaPirts.description'),
      images: [
        'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/23.png',
        'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/24.png'
      ],
      delay: '200ms'
    },
    {
      title: t('herbTub.title'),
      description: t('herbTub.description'),
      images: [
        'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/31.png',
        'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/30.png'
      ],
      delay: '400ms'
    }
  ];

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

  return (
    <section className="py-12 sm:py-16 md:py-24 bg-black relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Title and Subtitle */}
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold text-white mb-4 sm:mb-6 lg:mb-8">
            {t('title')}
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        {/* Three Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 mb-12 sm:mb-16">
          {saunas.map((sauna, index) => (
            <div
              key={index}
              ref={el => cardsRef.current[index] = el}
              className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-102 hover:shadow-[0_0_30px_rgba(0,255,120,0.15)] ${
                visibleCards[index] 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-12'
              }`}
              style={{ 
                backgroundColor: 'rgba(34,60,34,0.75)',
                transitionDelay: visibleCards[index] ? sauna.delay : '0ms'
              }}
            >
              {/* Image Carousel */}
              <div className="relative h-48 sm:h-56 overflow-hidden">
                {/* Images */}
                {sauna.images.map((image, imageIndex) => (
                  <div
                    key={imageIndex}
                    className={`absolute inset-0 transition-opacity duration-500 ${
                      imageIndex === currentImageIndices[index] ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${sauna.title} ${imageIndex + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                ))}
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent"></div>

                {/* Navigation Arrows */}
                <button
                  onClick={() => handleImageNavigation(index, 'prev')}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                
                <button
                  onClick={() => handleImageNavigation(index, 'next')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>

                {/* Image Indicators */}
                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-2 md:gap-3">
                  {sauna.images.map((_, imageIndex) => (
                    <button
                      key={imageIndex}
                      onClick={() => setCurrentImageIndices(prev => {
                        const newIndices = [...prev];
                        newIndices[index] = imageIndex;
                        return newIndices;
                      })}
                      className={`w-8 h-8 md:w-2 md:h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        imageIndex === currentImageIndices[index] 
                          ? 'bg-white shadow-lg shadow-white/50 ring-1 ring-white/30' 
                          : 'bg-white/50 hover:bg-white/75 border border-white/20'
                      }`}
                      aria-label={`Go to image ${imageIndex + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 sm:p-8 text-left">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-4 sm:mb-6">
                  {sauna.title}
                </h3>
                
                <p className="text-white leading-relaxed text-sm sm:text-base lg:text-lg">
                  {sauna.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Centered CTA Button */}
        <div className="text-center">
          <Link 
            to="/pirts-noma"
            className="inline-block w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white px-8 sm:px-10 py-4 rounded-xl text-base sm:text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25 text-center"
          >
            {t('cta')}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default RentalSaunasSection;