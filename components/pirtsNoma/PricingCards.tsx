import React, { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PricingCards = () => {
  const [isVisible, setIsVisible] = useState(false);
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

  const handleBookingClick = () => {
    // This will be handled by the data attributes on the button
  };

  const pricingOptions = t('pricing.options', { returnObjects: true });

  return (
    <section 
      ref={sectionRef}
      className="py-20 px-6 max-w-7xl mx-auto"
    >
      <div className={`text-center mb-16 transform transition-all duration-1000 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
      }`}>
        <h2 className="text-4xl lg:text-5xl font-bold text-white mb-8">
          {t('pricing.title')}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {pricingOptions.map((option, index) => (
          <div
            key={index}
            className={`relative bg-[#132d13] rounded-2xl p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20 ${
              option.popular ? 'ring-2 ring-green-500 shadow-2xl shadow-green-500/20' : ''
            } ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}
            style={{ transitionDelay: `${index * 200}ms` }}
          >
            {option.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                  Populārākais
                </span>
              </div>
            )}
            
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-4">{option.title}</h3>
              <div className="text-3xl font-bold text-green-400 mb-6">{option.priceRange}</div>
            </div>

            {/* Pricing Options */}
            <div className="space-y-4 mb-8">
              {option.options.map((pricing, pricingIndex) => (
                <div key={pricingIndex} className="flex items-center justify-between bg-black/30 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-white font-semibold">{pricing.duration}</span>
                    {pricing.note && (
                      <span className="text-gray-400 text-sm">{pricing.note}</span>
                    )}
                  </div>
                  <span className="text-green-400 font-bold text-lg">{pricing.price}</span>
                </div>
              ))}
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-8">
              {option.features.map((feature, featureIndex) => (
                <li key={featureIndex} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>

            <button 
              onClick={() => (window as any).openCustomPopup?.('noma')}
              className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 cursor-pointer ${
                option.popular
                  ? 'bg-green-600 hover:bg-green-500 text-white hover:shadow-lg hover:shadow-green-500/25'
                  : 'border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white hover:shadow-lg hover:shadow-green-500/25'
              }`}
            >
              {t('pricing.cta')}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PricingCards;