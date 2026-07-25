import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Hand, Home, Gift } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ServiceCardsSection = () => {
  const [visibleCards, setVisibleCards] = useState<boolean[]>([false, false, false, false]);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const { t } = useTranslation('services');

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

  const services = [
    {
      title: t('ritual.title'),
      description: t('ritual.description'),
      icon: Leaf,
      path: '/pirts-rituali',
      delay: '0ms'
    },
    {
      title: t('experiences.title'),
      description: t('experiences.description'),
      icon: Hand,
      path: '/ipasiie-piedzivvojumi',
      delay: '150ms'
    },
    {
      title: t('rental.title'),
      description: t('rental.description'),
      icon: Home,
      path: '/pirts-noma',
      delay: '300ms'
    },
    {
      title: t('giftCards.title'),
      description: t('giftCards.description'),
      icon: Gift,
      path: '/davanu-kartes',
      delay: '450ms'
    }
  ];

  return (
    <section className="py-12 sm:py-16 md:py-24 bg-black relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {services.map((service, index) => {
            const IconComponent = service.icon;
            return (
              <Link
                to={service.path}
                key={index}
                ref={el => cardsRef.current[index] = el}
                className={`group relative rounded-3xl py-6 px-5 cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,120,0.3)] block ${
                  visibleCards[index] 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-12'
                }`}
                style={{ 
                  backgroundColor: 'rgba(34,60,34,0.75)',
                  transitionDelay: visibleCards[index] ? service.delay : '0ms'
                }}
              >
                {/* Icon */}
                <div className="text-center mb-4">
                  <div className="w-12 h-12 mx-auto bg-green-400/20 rounded-xl flex items-center justify-center">
                    <IconComponent className="w-8 h-8" style={{ color: '#70f1a6' }} />
                  </div>
                </div>

                {/* Content */}
                <div className="text-center">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">
                    {service.title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                    {service.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ServiceCardsSection;