import React, { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PriceTable = () => {
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

  const pricingPlans = t('pricing.plans', { returnObjects: true }) as Array<{
    title: string;
    price: string;
    description: string;
    features: string[];
    popular: boolean;
  }>;

  const handleBookingClick = () => {
    // This will be handled by the data attributes on the button
  };

  return (
    <section 
      ref={sectionRef}
      className="py-20 px-4 sm:px-6 max-w-7xl mx-auto overflow-x-hidden"
    >
      <div className={`text-center mb-16 transform transition-all duration-1000 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
      }`}>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-8">
          {t('pricing.title')}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {pricingPlans.map((plan, index) => (
          <div
            key={index}
            className={`relative bg-[#132d13] rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:scale-105 ${
              plan.popular ? 'ring-2 ring-green-500 shadow-2xl shadow-green-500/20' : ''
            } ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}
            style={{ transitionDelay: `${index * 200}ms` }}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold">
                  Populārākais
                </span>
              </div>
            )}
            
            <div className="text-center mb-8">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">{plan.title}</h3>
              <div className="text-2xl sm:text-3xl font-bold text-green-400 mb-6">{plan.price}</div>
              <p className="text-gray-300 text-sm mb-6 leading-relaxed break-words">{plan.description}</p>
            </div>

            <ul className="space-y-2 sm:space-y-3 mb-8">
              {plan.features.map((feature, featureIndex) => (
                <li key={featureIndex} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-300 text-sm sm:text-base break-words">{feature}</span>
                </li>
              ))}
            </ul>

            <button 
              onClick={() => (window as any).openCustomPopup?.('ritual')}
              className={`w-full py-3 sm:py-4 rounded-xl font-semibold transition-all duration-300 text-sm sm:text-base cursor-pointer ${
              plan.popular
                ? 'bg-green-600 hover:bg-green-500 text-white'
                : 'border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white'
            }`}>
              {t('pricing.cta')}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PriceTable;