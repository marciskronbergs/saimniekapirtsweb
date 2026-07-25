import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { TabType } from '../../pages/GrupuRitualiPage';
import { useTranslation } from 'react-i18next';

const GroupOptions = () => {
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

  const handleNavigateToRitual = (tab: TabType) => {
    navigate('/grupu-rituali', { state: { tab } });
  };

  const groupOptions = t('groupOptions.options', { returnObjects: true }).map((option: any, index: number) => ({
    ...option,
    tab: ['meistaru', 'draugu', 'draugu-plus'][index] as TabType,
    translatedRestrictions: option.restrictions?.map((key: string) => t(`groupOptions.${key}`)) || []
  }));

  return (
    <section 
      ref={sectionRef}
      className="py-24 px-4 sm:px-6 max-w-7xl mx-auto overflow-x-hidden"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-stretch">
        {/* Left: Image */}
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'
        }`}>
          <img
            src="https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/pirtnieki/grupu.png"
            alt="Grupa pirtī"
            className="w-full h-64 sm:h-full object-cover rounded-2xl"
          />
        </div>

        {/* Right: Three Cards */}
        <div className={`flex flex-col gap-6 transform transition-all duration-1000 bg-transparent ${
          isVisible ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'
        }`}>
          {groupOptions.map((option, index) => (
            <div
              key={index}
              className="bg-[#132d13] rounded-lg p-4 sm:p-6 flex flex-col justify-between h-full text-white w-full"
            >
              <div>
                <div className="text-xl sm:text-2xl font-bold text-green-400 mb-2 break-words">{option.price}</div>
                <div className="text-base sm:text-lg font-semibold text-white mb-4 break-words">{option.title}</div>
                
                <p className="text-gray-300 mb-3 leading-relaxed text-sm sm:text-base break-words">
                  {option.description}
                </p>
                
                {option.details && (
                  <p className="text-gray-300 mb-3 leading-relaxed text-sm sm:text-base break-words">
                    {option.details}
                  </p>
                )}
                
                {option.translatedRestrictions.length > 0 && (
                  <div className="space-y-1 mb-4">
                    {option.translatedRestrictions.map((restriction, restrictionIndex) => (
                      <div key={restrictionIndex} className="text-red-400 text-xs sm:text-sm break-words">
                        {restriction}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => handleNavigateToRitual(option.tab)}
                className="w-full bg-green-600 hover:bg-green-500 text-white px-4 sm:px-6 py-3 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 transform hover:scale-105 mt-4"
              >
                {t('groupOptions.cta')}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GroupOptions;