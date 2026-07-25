import React, { useEffect, useRef, useState } from 'react';
import HeaderSection from '../components/HeaderSection';
import FooterSection from '../components/FooterSection';
import { MapPin, Phone, Mail, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const RezervetPage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation('reserve');

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

  const handleRitualBooking = () => {
    (window as any).openCustomPopup?.('ritual');
  };

  const handleNomaBooking = () => {
    (window as any).openCustomPopup?.('noma');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <HeaderSection />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section 
          ref={sectionRef}
          className="py-24 px-6 max-w-7xl mx-auto"
        >
          <div className={`text-center mb-20 transform transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
          }`}>
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-8 tracking-tight">
              {t('title')}
            </h1>
          </div>

          {/* Two Service Blocks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-24">
            {/* Left Block - Pirts Rituāli */}
            <div 
              onClick={handleRitualBooking}
              className={`group cursor-pointer bg-gradient-to-br from-[#132d13] to-[#1a3d2e] rounded-3xl overflow-hidden shadow-2xl shadow-green-500/10 hover:shadow-green-500/20 transition-all duration-500 hover:scale-[1.02] transform ${
                isVisible ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'
              }`}
              style={{ transitionDelay: '200ms' }}
            >
              {/* Image Section */}
              <div className="relative h-64 overflow-hidden">
                <img
                  src="https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/4.png"
                  alt="Pirts Rituāli"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>
                
                {/* External Link Icon */}
                <div className="absolute top-6 right-6">
                  <div className="w-10 h-10 bg-green-600/90 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <ExternalLink className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                <h2 className="text-3xl font-bold text-white mb-6">
                  {t('ritualsTitle')}
                </h2>
                
                <p className="text-lg text-gray-300 leading-relaxed mb-8">
                  {t('ritualsDesc')}
                </p>

                <button className="w-full bg-green-600 hover:bg-green-700 text-white py-4 px-8 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/25">
                  {t('reserve')}
                </button>
              </div>
            </div>

            {/* Right Block - Pirts Noma */}
            <div 
              onClick={handleNomaBooking}
              className={`group cursor-pointer bg-gradient-to-br from-[#132d13] to-[#1a3d2e] rounded-3xl overflow-hidden shadow-2xl shadow-green-500/10 hover:shadow-green-500/20 transition-all duration-500 hover:scale-[1.02] transform ${
                isVisible ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'
              }`}
              style={{ transitionDelay: '400ms' }}
            >
              {/* Image Section */}
              <div className="relative h-64 overflow-hidden">
                <img
                  src="https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/15.png"
                  alt="Pirts Noma"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>
                
                {/* External Link Icon */}
                <div className="absolute top-6 right-6">
                  <div className="w-10 h-10 bg-green-600/90 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <ExternalLink className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                <h2 className="text-3xl font-bold text-white mb-6">
                  {t('rentTitle')}
                </h2>
                
                <p className="text-lg text-gray-300 leading-relaxed mb-8">
                  {t('rentDesc')}
                </p>

                <button className="w-full bg-green-600 hover:bg-green-700 text-white py-4 px-8 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/25">
                  {t('reserve')}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Location Section */}
        <section className="py-20 px-6 max-w-7xl mx-auto">
          <div className={`mb-16 transform transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
          }`} style={{ transitionDelay: '600ms' }}>
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-8 text-center">
              {t('location')}
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Left: Contact Information */}
            <div className={`transform transition-all duration-1000 ${
              isVisible ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'
            }`} style={{ transitionDelay: '800ms' }}>
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-6">
                    {t('transport')}
                  </h3>
                  <p className="text-lg text-gray-300 leading-relaxed mb-8">
                    {t('transportDesc')}
                  </p>
                </div>

                {/* Contact Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4 bg-[#132d13] rounded-lg p-4">
                    <Mail className="w-6 h-6 text-green-400 flex-shrink-0" />
                    <span className="text-white text-lg">info@saimniekapirts.lv</span>
                  </div>
                  
                  <div className="flex items-center gap-4 bg-[#132d13] rounded-lg p-4">
                    <Phone className="w-6 h-6 text-green-400 flex-shrink-0" />
                    <span className="text-white text-lg">+371 26 752 661</span>
                  </div>
                  
                  <div className="flex items-center gap-4 bg-[#132d13] rounded-lg p-4">
                    <MapPin className="w-6 h-6 text-green-400 flex-shrink-0" />
                    <span className="text-white text-lg">"Sarma Nr. 123", Baldones pagasts, Ķekavas novads, LV-2125</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Google Map */}
            <div className={`transform transition-all duration-1000 ${
              isVisible ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'
            }`} style={{ transitionDelay: '1000ms' }}>
              <div className="rounded-2xl overflow-hidden shadow-2xl shadow-green-500/10">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2175.8234567890123!2d24.2903839!3d56.6841314!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x46e8d7c87772959d:0xdc371260f63bdc6b!2sSaimniekapirts%20%26%20SarmaSpa%20-%20pirts%20un%20pirtnieka%20pakalpojumi!5e0!3m2!1sen!2slv!4v1234567890123!5m2!1sen!2slv"
                  width="100%"
                  height="400"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="SaimniekaPirts Location"
                ></iframe>
              </div>
            </div>
          </div>
        </section>

        {/* Company Legal Info Footer */}
        <section className="py-20 px-6 max-w-7xl mx-auto">
          <div className={`bg-[#132d13] rounded-3xl p-8 lg:p-12 shadow-xl shadow-green-500/10 transform transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
          }`} style={{ transitionDelay: '1200ms' }}>
            <h3 className="text-2xl font-bold text-white mb-8 text-left">
              {t('companyInfo')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-300">
              <div className="space-y-3">
                <div>
                  <span className="font-semibold text-green-400">{t('companyName')}:</span>
                  <span className="ml-2">SARMA SPA SIA</span>
                </div>
                
                <div>
                  <span className="font-semibold text-green-400">{t('contactAddress')}:</span>
                  <span className="ml-2">Ķekavas nov., Baldones pag., "Kroņmeži", LV-2125</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <span className="font-semibold text-green-400">{t('companyReg')}:</span>
                  <span className="ml-2">50203583111</span>
                </div>
                
                <div>
                  <span className="font-semibold text-green-400">{t('companyBank')}:</span>
                </div>
                
                <div>
                  <span className="font-semibold text-green-400">{t('companyIBAN')}:</span>
                  <span className="ml-2">LV03HABA0551058479323</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <FooterSection />
    </div>
  );
};

export default RezervetPage;