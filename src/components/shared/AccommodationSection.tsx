import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bed } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AccommodationSection = () => {
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
      <div className={`bg-[#132d13] rounded-2xl overflow-hidden transform transition-all duration-1000 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
      }`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Left: Icon Section */}
          <div className="lg:col-span-3 flex items-center justify-center p-8 lg:p-12">
            <div className={`transform transition-all duration-1000 ${
              isVisible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
            }`} style={{ transitionDelay: '200ms' }}>
              <div className="w-20 h-20 lg:w-24 lg:h-24 mx-auto bg-green-400/20 rounded-2xl flex items-center justify-center">
                <Bed className="w-12 h-12 lg:w-14 lg:h-14 text-green-400" />
              </div>
            </div>
          </div>

          {/* Right: Content Section */}
          <div className="lg:col-span-9 p-8 lg:p-12 flex flex-col justify-center">
            <div className={`transform transition-all duration-1000 ${
              isVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
            }`} style={{ transitionDelay: '400ms' }}>
              <h3 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                {t('accommodation.title')}
              </h3>
              
              <p className="text-xl text-gray-300 leading-relaxed mb-8">
                {t('accommodation.description')}
              </p>

              <div className="text-center lg:text-left">
                <Link 
                  to="/naksnosana"
                  className="bg-green-600 hover:bg-green-500 text-white px-10 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25"
                >
                  {t('accommodation.cta')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AccommodationSection;