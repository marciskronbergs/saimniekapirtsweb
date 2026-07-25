import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Building } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LocationSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation('location');

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

  const contactInfo = [
    {
      icon: MapPin,
      title: t('contactAddress'),
      content: '"Sarma Nr. 123", Baldones pagasts, Ķekavas novads, LV-2125'
    },
    {
      icon: Phone,
      title: t('contactPhone'),
      content: '+371 26 752 661'
    },
    {
      icon: Mail,
      title: t('contactEmail'),
      content: 'info@saimniekapirts.lv'
    }
  ];

  return (
    <section ref={sectionRef} className="py-12 sm:py-16 md:py-24 bg-black relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Left Column - Map */}
          <div className={`transform transition-all duration-1000 ${
            isVisible ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'
          }`}>
            {/* Google Map Embed */}
            <div className="rounded-xl shadow-md overflow-hidden h-[250px] sm:h-[300px] lg:h-[350px] mb-4 sm:mb-6">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2175.8234567890123!2d24.2903839!3d56.6841314!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x46e8d7c87772959d:0xdc371260f63bdc6b!2sSaimniekapirts%20%26%20SarmaSpa%20-%20pirts%20un%20pirtnieka%20pakalpojumi!5e0!3m2!1sen!2slv!4v1234567890123!5m2!1sen!2slv"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="SaimniekaPirts Location"
              ></iframe>
            </div>

            {/* Transport Info */}
            <div className="text-gray-300 text-sm sm:text-base lg:text-lg leading-relaxed mb-8 lg:mb-0">
              <p>
                <strong>{t('transport')}</strong> {t('transportDesc')}
              </p>
            </div>
          </div>

          {/* Right Column - Contact Info */}
          <div className={`transform transition-all duration-1000 ${
            isVisible ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'
          }`} style={{ transitionDelay: '200ms' }}>
            
            {/* Contact Info Cards */}
            <div className="space-y-3 sm:space-y-4 mb-8 sm:mb-10 lg:mb-12">
              {contactInfo.map((info, index) => {
                const IconComponent = info.icon;
                return (
                  <div
                    key={index}
                    className={`bg-[#111] rounded-lg px-3 sm:px-4 py-3 text-white flex items-center gap-3 transform transition-all duration-500 ${
                      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                    }`}
                    style={{ transitionDelay: `${400 + index * 100}ms` }}
                  >
                    <IconComponent className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-gray-300 text-xs sm:text-sm">{info.title}:</span>
                      <span className="ml-2 text-sm sm:text-base break-all">{info.content}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Company Information */}
            <div className={`transform transition-all duration-1000 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`} style={{ transitionDelay: '700ms' }}>
              <h4 className="text-white font-bold text-lg sm:text-xl mb-4 sm:mb-6">{t('companyInfo')}</h4>
              
              <div className="space-y-2 sm:space-y-3">
                <div className="bg-[#111] rounded-lg px-3 sm:px-4 py-3 text-white flex items-center gap-3">
                  <Building className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-sm sm:text-base">SARMA SPA SIA</span>
                </div>
                
                <div className="bg-[#111] rounded-lg px-3 sm:px-4 py-3 text-white flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-sm sm:text-base">Ķekavas nov., Baldones pag., "Kroņmeži", LV-2125</span>
                </div>
                
                <div className="bg-[#111] rounded-lg px-3 sm:px-4 py-3 text-white flex items-center gap-3">
                  <span className="w-5 h-5 text-green-400 flex-shrink-0 text-center font-bold">#</span>
                  <span className="text-sm sm:text-base">{t('companyReg')}: 50203583111</span>
                </div>
                
                <div className="bg-[#111] rounded-lg px-3 sm:px-4 py-3 text-white flex items-center gap-3">
                  <span className="w-5 h-5 text-green-400 flex-shrink-0 text-center font-bold">$</span>
                  <span className="text-sm sm:text-base">A/S SwedBank</span>
                </div>
                
                <div className="bg-[#111] rounded-lg px-3 sm:px-4 py-3 text-white flex items-start gap-3">
                  <span className="w-5 h-5 text-green-400 flex-shrink-0 text-center font-bold">№</span>
                  <span className="text-sm sm:text-base break-all">{t('companyIBAN')}: LV03HABA0551058479323</span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className={`mt-8 sm:mt-10 lg:mt-12 transform transition-all duration-1000 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`} style={{ transitionDelay: '900ms' }}>
              <Link 
                to="/rezervet"
                className="block w-full bg-green-600 hover:bg-green-500 text-white py-4 sm:py-5 px-6 sm:px-8 rounded-xl text-base sm:text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25 text-center"
              >
                {t('reserveNow')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LocationSection;