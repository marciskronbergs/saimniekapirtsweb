import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import HeaderSection from '../components/HeaderSection';
import FooterSection from '../components/FooterSection';
import { Crown, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const IpasiePiedzivvojumiPage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation('special');

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

  const specialExperiences = [
    { 
      title: t('bachelorette'), 
      icon: Crown,
      path: '/vecmeitas-purs',
      description: t('bachelorette_desc')
    },
    { 
      title: t('bachelor'), 
      icon: Users,
      path: '/viru-paka',
      description: t('bachelor_desc')
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <HeaderSection />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section ref={sectionRef} className="py-20 px-6 max-w-7xl mx-auto">
          <div className={`text-center mb-16 transform transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
          }`}>
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-8">
              {t('title')}
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-12">
              {t('subtitle')}
            </p>
          </div>
        </section>

        {/* Special Experiences Cards */}
        <section className="py-20 px-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {specialExperiences.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <Link
                  key={index}
                  to={item.path}
                  className={`group relative rounded-3xl py-12 px-8 cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,120,0.3)] ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                  }`}
                  style={{ 
                    backgroundColor: 'rgba(34,60,34,0.75)',
                    transitionDelay: `${index * 200}ms`
                  }}
                >
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto bg-green-400/20 rounded-xl flex items-center justify-center mb-6">
                      <IconComponent className="w-10 h-10 text-green-400" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-4">
                      {item.title}
                    </h3>
                    <p className="text-gray-300 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>

      <FooterSection />
    </div>
  );
};

export default IpasiePiedzivvojumiPage;
