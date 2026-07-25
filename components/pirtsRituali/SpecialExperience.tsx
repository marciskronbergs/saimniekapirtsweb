import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SpecialExperience = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
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

  const handleNavigateToExperience = (path: string) => {
    navigate(path);
    // Smooth scroll to top after navigation
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const specialExperiences = t('specialExperiences.experiences', { returnObjects: true }).map((exp: any, index: number) => ({
    ...exp,
    icon: index === 0 ? Crown : Users
  }));

  return (
    <section 
      ref={sectionRef}
      className="py-20 px-4 sm:px-6 max-w-7xl mx-auto overflow-x-hidden"
    >
      <div className={`text-center mb-16 transform transition-all duration-1000 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
      }`}>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-8">
          {t('specialExperiences.title')}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
        {specialExperiences.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <button
              key={index}
              onClick={() => handleNavigateToExperience(index === 0 ? '/vecmeitas-purs' : '/viru-paka')}
              className={`group relative rounded-3xl py-8 sm:py-12 px-6 sm:px-8 cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,120,0.3)] w-full text-left ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
              }`}
              style={{ 
                backgroundColor: 'rgba(34,60,34,0.75)',
                transitionDelay: `${index * 200}ms`
              }}
            >
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-green-400/20 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                  <IconComponent className="w-8 h-8 sm:w-10 sm:h-10 text-green-400" />
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white break-words">
                  {item.title}
                </h3>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default SpecialExperience;