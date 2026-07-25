import React, { useState, useEffect } from 'react';
import { Check, ChevronLeft, ChevronRight, Bed } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const GrupuPirtsMeistaru = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { t } = useTranslation('groupRituals');

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const images = [
    'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/31.png',
    'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/60.png',
    'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/61.png',
    'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/65.png'
  ];

  const includedItems = t('meistaru.includedItems', { returnObjects: true });
  const features = t('meistaru.features', { returnObjects: true });

  const handleImageNavigation = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentImageIndex((prev) => (prev + images.length - 1) % images.length);
    } else {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const handleReserveClick = () => {
    (window as any).openCustomPopup?.('ritual');
  };

  return (
    <div className="py-20 px-6 max-w-7xl mx-auto">
      {/* Title Block */}
      <div className={`text-center mb-16 transform transition-all duration-1000 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
      }`}>
        <h1 className="text-4xl lg:text-6xl font-bold text-white mb-8">
          {t('meistaru.title')}
        </h1>
        <h2 className="text-3xl lg:text-4xl font-bold text-green-400 mb-8">
          {t('meistaru.subtitle')}
        </h2>
      </div>

      {/* Ticējums Block */}
      <div className={`max-w-3xl mx-auto mb-16 transform transition-all duration-1000 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
      }`} style={{ transitionDelay: '200ms' }}>
        <div className="bg-[#132d13] rounded-2xl p-8 border-l-4 border-green-500">
          <h3 className="text-xl font-bold text-white mb-4 text-center">{t('ticējums.title')}</h3>
          <div className="text-lg text-gray-300 italic text-center leading-relaxed">
            <p>{t('ticējums.text')}</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
        {/* Left: Image Carousel */}
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'
        }`} style={{ transitionDelay: '400ms' }}>
          <div className="relative rounded-2xl overflow-hidden group">
            {/* Images */}
            {images.map((image, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-all duration-700 ${
                  index === currentImageIndex 
                    ? 'opacity-100 scale-100' 
                    : 'opacity-0 scale-105'
                }`}
              >
                <img
                  src={image}
                  alt={`${t('meistaru.cardTitle')} ${index + 1}`}
                  className="w-full h-[400px] object-cover"
                />
              </div>
            ))}
            
            {/* First image for layout */}
            <img
              src={images[0]}
              alt={t('meistaru.cardTitle')}
              className="w-full h-[400px] object-cover opacity-0"
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>

            {/* Navigation Arrows */}
            <button
              onClick={() => handleImageNavigation('prev')}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            
            <button
              onClick={() => handleImageNavigation('next')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>

            {/* Pagination Dots */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 md:gap-3">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-8 h-8 md:w-3 md:h-3 rounded-full transition-all duration-300 cursor-pointer ${
                    index === currentImageIndex 
                      ? 'bg-green-500 shadow-lg shadow-green-500/50 scale-110 md:scale-125 ring-2 ring-white/30' 
                      : 'bg-white/50 hover:bg-white/75 border border-white/20'
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right: Info Card */}
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'
        }`} style={{ transitionDelay: '600ms' }}>
          <div className="bg-[#132d13] rounded-3xl p-8 lg:p-12 shadow-xl shadow-green-500/10">
            <h3 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              {t('meistaru.cardTitle')}
            </h3>
            
            <div className="text-3xl font-bold text-green-400 mb-8">
              {t('meistaru.price')}
            </div>
            
            <p className="text-lg text-gray-300 leading-relaxed mb-8">
              {t('meistaru.description')}
            </p>

            {/* Service Details */}
            {/* Service Features List */}
            <div className="space-y-4 mb-8">
              {features.map((feature: string, index: number) => (
                <div key={index} className="flex items-center gap-3">
                  {feature.startsWith('❌') ? (
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">✕</span>
                    </div>
                  ) : (
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  )}
                  <span className={`text-gray-300 ${feature.startsWith('❌') ? 'text-red-400' : ''}`}>
                    {feature.replace('❌ ', '')}
                  </span>
                </div>
              ))}
            </div>

            <button 
              onClick={handleReserveClick}
              className="w-full bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25 cursor-pointer"
            >
              {t('meistaru.ctaButton')}
            </button>
          </div>
        </div>
      </div>

      {/* Pakalpojumā ietilpst Section */}
      <div className={`bg-[#132d13] rounded-2xl p-8 lg:p-12 mb-16 transform transition-all duration-1000 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
      }`} style={{ transitionDelay: '800ms' }}>
        <h3 className="text-2xl lg:text-3xl font-bold text-white mb-8 text-center">
          {t('meistaru.includedTitle')}
        </h3>
        
        <div className="space-y-6">
          {includedItems.map((item: string, index: number) => (
            <div
              key={index}
              className={`flex items-start gap-4 transform transition-all duration-500 ${
                isVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
              }`}
              style={{ transitionDelay: `${1000 + index * 100}ms` }}
            >
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white font-bold text-lg">{index + 1}</span>
              </div>
              <p className="text-gray-300 text-lg leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Papildus Section */}
      <div className={`bg-[#132d13] rounded-2xl p-8 lg:p-12 mb-16 transform transition-all duration-1000 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
      }`} style={{ transitionDelay: '1200ms' }}>
        <h3 className="text-2xl font-bold text-white mb-8 text-center">
          {t('meistaru.additionalTitle')}
        </h3>
        
        <div className="space-y-6 text-gray-300">
          <div>
            <span className="font-semibold text-green-400">{t('meistaru.additionalRental')}</span>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">{t('meistaru.additionalPeriensTitle')}</h4>
            <div className="bg-black/30 rounded-lg p-4">
              <span className="text-green-400 font-bold text-xl">{t('meistaru.additionalPeriensPrice')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Nakšņošana Section */}
      <div className={`bg-[#132d13] rounded-2xl p-8 lg:p-12 mb-16 transform transition-all duration-1000 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
      }`} style={{ transitionDelay: '1400ms' }}>
        <div className="flex items-center justify-center gap-4 mb-6">
          <Bed className="w-8 h-8 text-green-400" />
          <h3 className="text-2xl font-bold text-white">{t('meistaru.accommodationTitle')}</h3>
        </div>
        
        <div className="text-center">
          <div className="text-3xl font-bold text-green-400 mb-2">
            {t('meistaru.accommodationPrice')}
          </div>
          <p className="text-gray-300">{t('meistaru.accommodationNote')}</p>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="text-center">
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`} style={{ transitionDelay: '1600ms' }}>
          <h2 className="text-3xl font-bold text-white mb-4">
            {t('meistaru.ctaTitle')}
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            {t('meistaru.ctaSubtitle')}
          </p>
          <button 
            onClick={handleReserveClick}
            className="bg-green-600 hover:bg-green-500 text-white px-12 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25 cursor-pointer"
          >
            {t('meistaru.ctaButton')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GrupuPirtsMeistaru;