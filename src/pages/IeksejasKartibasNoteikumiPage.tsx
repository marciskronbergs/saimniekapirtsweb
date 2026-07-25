import React from 'react';
import HeaderSection from '../components/HeaderSection';
import FooterSection from '../components/FooterSection';
import { Shield, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const IeksejasKartibasNoteikumiPage = () => {
  const { t } = useTranslation('rules');

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <HeaderSection />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-24 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-green-600/20 rounded-full flex items-center justify-center">
                <Shield className="w-10 h-10 text-green-400" />
              </div>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-8 tracking-tight">
              {t('title')}
            </h1>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              {t('subtitle')}
            </p>
          </div>

          {/* Content Sections */}
          <div className="max-w-5xl mx-auto">
            <div className="bg-[#132d13] rounded-3xl p-8 lg:p-12 shadow-xl shadow-green-500/10">
              
              {/* Introduction */}
              <div className="mb-12">
                <p className="text-lg text-gray-300 leading-relaxed mb-6">
                  {t('intro.description')}
                </p>
                <p className="text-lg text-gray-300 leading-relaxed mb-6">
                  {t('intro.compliance')}
                </p>
                <p className="text-lg text-gray-300 leading-relaxed mb-6">
                  {t('intro.liability')}
                </p>
                <p className="text-lg text-gray-300 leading-relaxed">
                  {t('intro.acknowledgment')}
                </p>
              </div>

              {/* Section I */}
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-white mb-6">{t('section1.title')}</h3>
                <ul className="list-disc pl-6 space-y-3 text-gray-300">
                  {t('section1.rules', { returnObjects: true }).map((rule: string, index: number) => (
                    <li key={index} className="leading-relaxed">{rule}</li>
                  ))}
                </ul>
              </div>

              {/* Section II */}
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-white mb-6">{t('section2.title')}</h3>
                
                <div className="mb-6">
                  <h4 className="text-xl font-semibold text-green-400 mb-4">{t('section2.subsection1.title')}</h4>
                  <ul className="list-disc pl-6 space-y-3 text-gray-300">
                    {t('section2.subsection1.rules', { returnObjects: true }).map((rule: string, index: number) => (
                      <li key={index} className="leading-relaxed">{rule}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xl font-semibold text-green-400 mb-4">2.</h4>
                  <p className="text-gray-300 leading-relaxed">{t('section2.subsection2.title')}</p>
                </div>
              </div>

              {/* Section III */}
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-white mb-6">{t('section3.title')}</h3>
                <ul className="list-disc pl-6 space-y-3 text-gray-300">
                  {t('section3.rules', { returnObjects: true }).map((rule: string, index: number) => (
                    <li key={index} className="leading-relaxed">{rule}</li>
                  ))}
                </ul>
              </div>

              {/* Section IV */}
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-white mb-6">{t('section4.title')}</h3>
                <ul className="list-disc pl-6 space-y-3 text-gray-300">
                  {t('section4.rules', { returnObjects: true }).map((rule: string, index: number) => (
                    <li key={index} className="leading-relaxed">{rule}</li>
                  ))}
                </ul>
              </div>

              {/* Section V */}
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-white mb-6">{t('section5.title')}</h3>
                <ul className="list-disc pl-6 space-y-3 text-gray-300">
                  {t('section5.rules', { returnObjects: true }).map((rule: string, index: number) => (
                    <li key={index} className="leading-relaxed">{rule}</li>
                  ))}
                </ul>
              </div>

              {/* Section VI */}
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-white mb-6">{t('section6.title')}</h3>
                <ul className="list-disc pl-6 space-y-3 text-gray-300">
                  {t('section6.rules', { returnObjects: true }).map((rule: string, index: number) => (
                    <li key={index} className="leading-relaxed">{rule}</li>
                  ))}
                </ul>
              </div>

              {/* Section VII */}
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-white mb-6">{t('section7.title')}</h3>
                <ul className="list-disc pl-6 space-y-3 text-gray-300">
                  {t('section7.rules', { returnObjects: true }).map((rule: string, index: number) => (
                    <li key={index} className="leading-relaxed">{rule}</li>
                  ))}
                </ul>
              </div>

              {/* Warning Box */}
              <div className="bg-gradient-to-r from-orange-600/20 to-red-600/20 border-l-4 border-orange-500 rounded-xl p-6">
                <div className="flex items-center gap-4">
                  <AlertTriangle className="w-8 h-8 text-orange-400 flex-shrink-0" />
                  <p className="text-lg font-semibold text-orange-100">
                    {t('warning.text')}
                  </p>
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

export default IeksejasKartibasNoteikumiPage;