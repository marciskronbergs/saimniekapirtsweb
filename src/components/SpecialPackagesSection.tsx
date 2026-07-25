import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Crown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SpecialPackagesSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation('events');

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
        {/* Title and Subtitle */}
        <div className={`text-center mb-12 sm:mb-16 lg:mb-20 transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold text-white mb-4 sm:mb-6 lg:mb-8">
            {t('title')}
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left Side - Service Blocks */}
          <div className="space-y-6 sm:space-y-8 mb-8 lg:mb-0">
            {/* Vecmeitu Pirts */}
            <Link
              to="/vecmeitas-purs"
              className={`group relative rounded-3xl py-6 sm:py-8 px-6 sm:px-8 cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,120,0.3)] block ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            }`}
            style={{ 
              backgroundColor: 'rgba(34,60,34,0.75)',
              transitionDelay: isVisible ? '200ms' : '0ms'
            }}>
              {/* Icon */}
              <div className="text-center mb-3 sm:mb-4">
                <div className="w-12 h-12 mx-auto bg-green-400/20 rounded-xl flex items-center justify-center">
                  <Crown className="w-8 h-8" style={{ color: '#70f1a6' }} />
                </div>
              </div>

              {/* Content */}
              <div className="text-center">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                  {t('bachelorette')}
                </h3>
              </div>
            </Link>

            {/* Vīru Paka */}
            <Link
              to="/viru-paka"
              className={`group relative rounded-3xl py-6 sm:py-8 px-6 sm:px-8 cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,120,0.3)] block ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            }`}
            style={{ 
              backgroundColor: 'rgba(34,60,34,0.75)',
              transitionDelay: isVisible ? '400ms' : '0ms'
            }}>
              {/* Icon */}
              <div className="text-center mb-3 sm:mb-4">
                <div className="w-12 h-12 mx-auto bg-green-400/20 rounded-xl flex items-center justify-center">
                  <Users className="w-8 h-8" style={{ color: '#70f1a6' }} />
                </div>
              </div>

              {/* Content */}
              <div className="text-center">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                  {t('bachelor')}
                </h3>
              </div>
            </Link>
          </div>

          {/* Right Side - Title, Description and Button */}
          <div className={`transform transition-all duration-1000 ${
            isVisible ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'
          }`} style={{ transitionDelay: '600ms' }}>
            <div className="mb-8 lg:mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-4 sm:mb-6 lg:mb-8">
                {t('title')}
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-gray-300 leading-relaxed">
                {t('description')}
              </p>
            </div>

            {/* CTA Button */}
            <Link 
              to="/ipasiie-piedzivvojumi"
              className="inline-block w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white px-8 sm:px-10 py-4 rounded-xl text-base sm:text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25 text-center"
            >
              {t('cta')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SpecialPackagesSection;