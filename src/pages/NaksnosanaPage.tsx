import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderSection from '../components/HeaderSection';
import FooterSection from '../components/FooterSection';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const NaksnosanaPage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [pusMelnaImageIndex, setPusMelnaImageIndex] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { t } = useTranslation('accommodation');

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

  // Auto-rotate images for Baltā Pirts
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % baltaPirtsImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const baltaPirtsImages = [
    'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/58.png',
    'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/56.png',
    'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/57.png',
    'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/vel/80.png'
  ];

  const pusMelnaImages = [
    'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/vel/77.png',
    'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/vel/76.png',
    'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/vel/78.png',
    'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/vel/79.png'
  ];

  // Auto-rotate images for Pus-Melnā Pirts
  useEffect(() => {
    const interval = setInterval(() => {
      setPusMelnaImageIndex((prev) => (prev + 1) % pusMelnaImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev + baltaPirtsImages.length - 1) % baltaPirtsImages.length);
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % baltaPirtsImages.length);
  };

  const handlePusMelnaPrevImage = () => {
    setPusMelnaImageIndex((prev) => (prev + pusMelnaImages.length - 1) % pusMelnaImages.length);
  };

  const handlePusMelnaNextImage = () => {
    setPusMelnaImageIndex((prev) => (prev + 1) % pusMelnaImages.length);
  };

  const handleOrderClick = () => {
    navigate('/rezervet');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <HeaderSection />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section 
          ref={sectionRef}
          className="relative py-24 px-6 max-w-7xl mx-auto overflow-hidden"
        >
          {/* Subtle Background Texture */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 via-transparent to-green-800/10"></div>
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, rgba(34, 197, 94, 0.1) 0%, transparent 50%), 
                               radial-gradient(circle at 75% 75%, rgba(34, 197, 94, 0.05) 0%, transparent 50%)`
            }}></div>
          </div>

          <div className={`relative z-10 text-center transform transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
          }`}>
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-8 tracking-tight">
              {t('title')}
            </h1>
            <p className="text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              {t('description')}
            </p>
          </div>
        </section>

        {/* Baltā Pirts Section */}
        <section className="py-20 px-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: Image Carousel */}
            <div className={`transform transition-all duration-1000 ${
              isVisible ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'
            }`} style={{ transitionDelay: '200ms' }}>
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-green-500/10 group">
                {/* Images */}
                {baltaPirtsImages.map((image, index) => (
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
                      alt={`Baltā Pirts ${index + 1}`}
                      className="w-full h-[400px] lg:h-[500px] object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                ))}
                
                {/* First image for layout */}
                <img
                  src={baltaPirtsImages[0]}
                  alt="Baltā Pirts"
                  className="w-full h-[400px] lg:h-[500px] object-cover opacity-0"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10"></div>

                {/* Navigation Arrows */}
                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>

                {/* Glowing Indicators */}
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 md:gap-3">
                  {baltaPirtsImages.map((_, index) => (
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

            {/* Right: Content */}
            <div className={`transform transition-all duration-1000 ${
              isVisible ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'
            }`} style={{ transitionDelay: '400ms' }}>
              <div className="bg-[#132d13] rounded-3xl p-8 lg:p-12 shadow-xl shadow-green-500/10 hover:shadow-green-500/15 transition-all duration-500 hover:scale-[1.02]">
                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                  {t('whiteSauna.title')}
                </h2>
                
                <p className="text-xl text-gray-300 leading-relaxed">
                  {t('whiteSauna.description')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pus-Melnā Pirts Section */}
        <section className="py-20 px-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: Image */}
            <div className={`lg:order-1 transform transition-all duration-1000 ${
              isVisible ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'
            }`} style={{ transitionDelay: '600ms' }}>
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-green-500/10 group">
                {/* Images */}
                {pusMelnaImages.map((image, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                      index === pusMelnaImageIndex 
                        ? 'opacity-100 scale-100' 
                        : 'opacity-0 scale-105'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Pelēkā Pirts ${index + 1}`}
                      className="w-full h-[400px] lg:h-[500px] object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                ))}
                
                {/* First image for layout */}
                <img
                  src={pusMelnaImages[0]}
                  alt="Pelēkā Pirts"
                  className="w-full h-[400px] lg:h-[500px] object-cover opacity-0"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10"></div>

                {/* Navigation Arrows */}
                <button
                  onClick={handlePusMelnaPrevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                
                <button
                  onClick={handlePusMelnaNextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>

                {/* Glowing Indicators */}
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 md:gap-3">
                  {pusMelnaImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setPusMelnaImageIndex(index)}
                      className={`w-8 h-8 md:w-3 md:h-3 rounded-full transition-all duration-300 cursor-pointer ${
                        index === pusMelnaImageIndex 
                          ? 'bg-green-500 shadow-lg shadow-green-500/50 scale-110 md:scale-125 ring-2 ring-white/30' 
                          : 'bg-white/50 hover:bg-white/75 border border-white/20'
                      }`}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Content */}
            <div className={`lg:order-0 transform transition-all duration-1000 ${
              isVisible ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'
            }`} style={{ transitionDelay: '800ms' }}>
              <div className="bg-[#132d13] rounded-3xl p-8 lg:p-12 shadow-xl shadow-green-500/10 hover:shadow-green-500/15 transition-all duration-500 hover:scale-[1.02]">
                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                  {t('blackSauna.title')}
                </h2>
                
                <p className="text-xl text-gray-300 leading-relaxed">
                  {t('blackSauna.description')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Unified Benefits & Pricing Section */}
        <section className="py-20 px-6 max-w-7xl mx-auto">
          <div className={`max-w-4xl mx-auto transform transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
          }`} style={{ transitionDelay: '1000ms' }}>
            <div className="bg-gradient-to-br from-[#132d13] to-[#1a3d2e] rounded-3xl p-8 lg:p-12 shadow-lg shadow-green-500/10 hover:shadow-green-500/15 transition-all duration-500 hover:scale-[1.01] relative overflow-hidden">
              {/* Subtle Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle at 20% 20%, rgba(34, 197, 94, 0.2) 0%, transparent 50%), 
                                   radial-gradient(circle at 80% 80%, rgba(34, 197, 94, 0.1) 0%, transparent 50%)`
                }}></div>
              </div>

              <div className="relative z-10">
                {/* Benefits Section - Horizontal Layout */}
                <div className="mb-12">
                  {/* Desktop: Horizontal Layout */}
                  <div className="hidden md:flex items-center justify-center gap-8 lg:gap-12">
                    {Object.values(t('perks', { returnObjects: true })).map((benefit: string, index: number) => (
                      <React.Fragment key={index}>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-lg lg:text-xl text-white font-medium whitespace-nowrap">{benefit}</span>
                        </div>
                        {index < 2 && (
                          <div className="w-px h-8 bg-gradient-to-b from-transparent via-green-500/40 to-transparent"></div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Mobile: Vertical Layout */}
                  <div className="md:hidden space-y-6">
                    {Object.values(t('perks', { returnObjects: true })).map((benefit: string, index: number) => (
                      <div key={index}>
                        <div className="flex items-center gap-4 py-2">
                          <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-lg text-white font-medium">{benefit}</span>
                        </div>
                        {index < 2 && (
                          <div className="ml-10 h-px bg-gradient-to-r from-green-500/30 via-green-500/10 to-transparent"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Full-Width Horizontal Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-green-500/40 to-transparent mb-12"></div>

                {/* Pricing Section */}
                <div className="text-center">
                  <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                    {t('priceTitle')}
                  </h2>
                  
                  <div className="text-4xl lg:text-5xl font-bold text-green-400 mb-4 tracking-tight">
                    {t('price')} <span className="text-xl lg:text-2xl text-gray-400">{t('priceNote')}</span>
                  </div>
                  
                  <p className="text-lg text-gray-300 mb-10">
                    {t('priceMin')}
                  </p>

                  <button 
                    onClick={handleOrderClick}
                    className="bg-green-600 hover:bg-green-500 text-white px-12 py-4 rounded-2xl text-lg font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-green-500/25 relative overflow-hidden group"
                  >
                    <span className="relative z-10">{t('cta')}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <FooterSection />
    </div>
  );
};

export default NaksnosanaPage;