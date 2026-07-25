import React, { useEffect, useRef, useState } from 'react';
import HeaderSection from '../components/HeaderSection';
import FooterSection from '../components/FooterSection';
import { Check, Bed, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ViruPakaPage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation('viru');

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

  const handleReserveClick = () => {
    (window as any).openCustomPopup?.('ritual');
  };

  const viruPakaImages = [
    'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/60.png',
    'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/61.png',
    'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/62.png',
    'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/64.png',
    'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/65.png'
  ];

  const handleImageNavigation = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentImageIndex((prev) => (prev + viruPakaImages.length - 1) % viruPakaImages.length);
    } else {
      setCurrentImageIndex((prev) => (prev + 1) % viruPakaImages.length);
    }
  };

  const setImageIndex = (imageIndex: number) => {
    setCurrentImageIndex(imageIndex);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <HeaderSection />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section ref={sectionRef} className="py-20 px-6 max-w-7xl mx-auto">
          <div className={`text-center mb-16 transform transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
          }`}>
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-8">
              {t('title')}
            </h1>
          </div>

          {/* Traditional Belief (Ticējums) */}
          <div className={`max-w-3xl mx-auto mb-16 transform transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
          }`} style={{ transitionDelay: '200ms' }}>
            <div className="bg-[#132d13] rounded-2xl p-8 border-l-4 border-green-500">
              <h3 className="text-xl font-bold text-white mb-4 text-center">{t('belief.title')}</h3>
              <div className="text-lg text-gray-300 italic text-center leading-relaxed">
                <p>{t('belief.text')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Section */}
        <section className="px-6 max-w-7xl mx-auto pb-20">
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
            {/* Left: Image Carousel */}
            <div className={`transform transition-all duration-1000 ${
              isVisible ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'
            }`} style={{ transitionDelay: '400ms' }}>
              <div className="relative rounded-2xl overflow-hidden group">
                {/* Images */}
                {viruPakaImages.map((image, index) => (
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
                      alt={`Vīru Paka ${index + 1}`}
                      className="w-full h-[400px] object-cover"
                    />
                  </div>
                ))}
                
                {/* First image for layout */}
                <img
                  src={viruPakaImages[0]}
                  alt="Vīru Paka"
                  className="w-full h-[400px] object-cover opacity-0"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>

                {/* Navigation Arrows - Centered Vertically */}
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
              </div>

              {/* Pagination Dots - Centered Below Carousel */}
              <div className="flex justify-center gap-2 md:gap-3 mt-6">
                {viruPakaImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setImageIndex(index)}
                    className={`w-8 h-8 md:w-3 md:h-3 rounded-full transition-all duration-300 cursor-pointer ${
                      index === currentImageIndex 
                        ? 'bg-green-500 shadow-lg shadow-green-500/50 scale-110 md:scale-125 ring-2 ring-white/30' 
                        : 'bg-gray-500 hover:bg-gray-400 hover:scale-110 border border-white/20'
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Right: Content */}
            <div className={`transform transition-all duration-1000 ${
              isVisible ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'
            }`} style={{ transitionDelay: '600ms' }}>
              <h3 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                {t('title').split('"')[1].replace('"', '')}
              </h3>
              
              <div className="text-2xl font-bold text-green-400 mb-8">
                {t('price')}
              </div>
              
              <p className="text-lg text-gray-300 leading-relaxed mb-8">
                {t('description1')}
              </p>

              <p className="text-lg text-gray-300 leading-relaxed mb-8">
                {t('description2')}
              </p>

              <p className="text-lg text-gray-300 leading-relaxed mb-8">
                {t('description3')}
              </p>

              {/* Service Details */}
              <div className="bg-[#132d13] rounded-xl p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
                  <div>
                    <span className="font-semibold text-green-400">{t('details.duration').split(':')[0]}:</span>
                    <span className="ml-2">{t('details.duration').split(':')[1].trim()}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-green-400">{t('details.included').split(':')[0]}:</span>
                    <span className="ml-2">{t('details.included').split(':')[1].trim()}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-green-400">{t('details.master').split(':')[0]}:</span>
                    <span className="ml-2">{t('details.master').split(':')[1].trim()}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-green-400">{t('details.availability').split(':')[0]}:</span>
                    <span className="ml-2">{t('details.availability').split(':')[1].trim()}</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleReserveClick}
                className="bg-green-600 hover:bg-green-500 text-white px-10 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25 cursor-pointer"
              >
                {t('cta.button')}
              </button>
            </div>
          </div>

          {/* Included Items Section */}
          <div className={`bg-[#132d13] rounded-2xl p-8 lg:p-12 mb-16 transform transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
          }`} style={{ transitionDelay: '800ms' }}>
            <h3 className="text-2xl lg:text-3xl font-bold text-white mb-8 text-center">
              {t('includedTitle')}
            </h3>
            
            <div className="space-y-6">
              {t('includedItems', { returnObjects: true }).map((item: string, index: number) => (
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

          {/* Additional Services & Pricing */}
          <div className={`bg-[#132d13] rounded-2xl p-8 lg:p-12 mb-16 transform transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
          }`} style={{ transitionDelay: '1200ms' }}>
            <h3 className="text-2xl font-bold text-white mb-8 text-center">
              {t('additionalTitle')}
            </h3>
            
            <div className="space-y-6 text-gray-300">
              <div>
                <span className="font-semibold text-green-400">{t('additional.rental').split('–')[0]}–</span>
                <span className="ml-2">{t('additional.rental').split('–')[1].trim()}</span>
              </div>
              
              <div>
                <h4 className="font-semibold text-white mb-4">{t('additional.extraTitle')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {t('additional.extraServices', { returnObjects: true }).map((service: any, index: number) => (
                    <div key={index} className="bg-black/30 rounded-lg p-4">
                      <span className="text-green-400 font-bold text-xl">{service.price}</span>
                      <p className="text-gray-300">{service.name}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-white mb-2">{t('additional.accommodation')}</h4>
                <span className="text-green-400 font-bold text-xl">{t('additional.accommodationPrice')}</span>
              </div>
            </div>
          </div>

          {/* Bottom CTA Section */}
          <div className="text-center">
            <div className={`transform transition-all duration-1000 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
            }`} style={{ transitionDelay: '1400ms' }}>
              <h2 className="text-3xl font-bold text-white mb-4">
                {t('cta.title')}
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                {t('cta.subtitle')}
              </p>
              <button 
                onClick={handleReserveClick}
                className="bg-green-600 hover:bg-green-500 text-white px-12 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25 cursor-pointer"
              >
                {t('cta.button')}
              </button>
            </div>
          </div>
        </section>
      </main>

      <FooterSection />
    </div>
  );
};

export default ViruPakaPage;