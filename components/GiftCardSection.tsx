import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Gift, Star, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const GiftCardSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const { t, i18n } = useTranslation('cards');

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Gift Card Display - Left Side */}
          <div className={`transform transition-all duration-1000 ${
            isVisible ? 'translate-x-0 opacity-100 scale-100' : '-translate-x-8 opacity-0 scale-95'
          }`}>
            <div className="relative mb-8 lg:mb-0">
              {/* Gift Card */}
              <div className="relative bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 rounded-2xl p-6 sm:p-8 shadow-2xl transform rotate-1 sm:rotate-3 hover:rotate-0 transition-transform duration-500">
                {/* Card Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-transparent rounded-2xl"></div>
                
                {/* Card Content */}
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <Gift className="w-8 h-8 text-white" />
                      <span className="text-white font-bold text-lg sm:text-xl">
                        {i18n.language === 'en' ? 'Gift Card' : 'Dāvanu Karte'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-300 fill-current" />
                      ))}
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-white text-xl sm:text-2xl font-bold mb-2">
                      {i18n.language === 'en' ? 'SAUNA EXPERIENCES' : 'PIRTS PIEDZĪVOJUMI'}
                    </h3>
                    <p className="text-amber-100 text-xs sm:text-sm">
                      {i18n.language === 'en' ? 'Gift card valid for all services' : 'Dāvanu karte visiem pakalpojumiem'}
                    </p>
                  </div>
                  
                  <div className="border-t border-amber-400/30 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-amber-100 text-xs sm:text-sm">
                        {i18n.language === 'en' ? 'Value:' : 'Vērtība:'}
                      </span>
                      <span className="text-white font-bold text-lg sm:text-xl">€80 - €380</span>
                    </div>
                  </div>
                </div>

                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-pulse"></div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-green-400 rounded-full animate-bounce"></div>
              <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-amber-400 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
            </div>
          </div>

          {/* Content - Right Side */}
          <div className={`transform transition-all duration-1000 ${
            isVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
          }`} style={{ transitionDelay: '200ms' }}>
            <div className="mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-4">
                {t('title')}
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-gray-300 leading-relaxed">
                {t('description')}
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
              {t('features', { returnObjects: true }).map((benefit: string, index: number) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 transform transition-all duration-500 ${
                    isVisible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
                  }`}
                  style={{ transitionDelay: `${400 + index * 100}ms` }}
                >
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-300 text-sm sm:text-base">{benefit}</span>
                </div>
              ))}
            </div>

            <div>
              {/* Orange CTA Button */}
              <Link 
                to="/davanu-kartes"
                className="block w-full bg-amber-600 hover:bg-amber-700 text-white py-4 px-6 sm:px-8 rounded-lg text-base sm:text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg text-center"
              >
                {t('cta')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GiftCardSection;