import { Link } from 'react-router-dom';
import React, { useEffect, useRef, useState } from 'react';
import { Gift, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const GiftCardSection = () => {
  const [isVisible, setIsVisible] = useState(false);
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

  const handleLearnMoreClick = () => {
    // Navigation handled by Link component
  };

  return (
    <section 
      ref={sectionRef}
      className="py-20 px-6 max-w-7xl mx-auto"
    >
      <div className="bg-[#132d13] rounded-3xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Left: Gift Card Image */}
          <div className={`relative transform transition-all duration-1000 ${
            isVisible ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'
          }`}>
            <div className="relative bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 p-12 h-full flex items-center justify-center">
              <div className="text-center">
                <Gift className="w-20 h-20 text-white mx-auto mb-6" />
                <h3 className="text-3xl font-bold text-white mb-4">{t('giftCards.giftCardVisual.title')}</h3>
                <p className="text-amber-100 text-lg">{t('giftCards.giftCardVisual.subtitle')}</p>
              </div>
            </div>
          </div>

          {/* Right: Content */}
          <div className={`p-12 flex flex-col justify-center transform transition-all duration-1000 ${
            isVisible ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'
          }`}>
            <h3 className="text-3xl font-bold text-white mb-6">
              {t('giftCards.title')}
            </h3>
            
            <p className="text-xl text-gray-300 leading-relaxed mb-8">
              {t('giftCards.description')}
            </p>
            
            <ul className="space-y-4 mb-8">
              {t('giftCards.features', { returnObjects: true }).map((feature: string, index: number) => (
                <li key={index} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>

            <Link 
              to="/davanu-kartes"
              className="inline-block bg-amber-600 hover:bg-amber-700 text-white px-10 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105"
            >
              {t('giftCards.cta')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GiftCardSection;