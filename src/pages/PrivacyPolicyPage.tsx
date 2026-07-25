import React from 'react';
import HeaderSection from '../components/HeaderSection';
import FooterSection from '../components/FooterSection';
import { Shield, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PrivacyPolicyPage = () => {
  const { t } = useTranslation('privacy');

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
                <p className="text-lg text-gray-300 leading-relaxed">
                  {t('intro.description')}
                </p>
              </div>

              {/* Controller Information */}
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-white mb-6">{t('controller.title')}</h3>
                <div className="space-y-3 text-gray-300">
                  <p><strong>{t('controller.company')}:</strong> SARMA SPA SIA</p>
                  <p><strong>{t('controller.regNumber')}:</strong> 50203583111</p>
                  <p><strong>{t('controller.address')}:</strong> Ķekavas nov., Baldones pag., "Kroņmeži", LV-2125</p>
                  <p><strong>{t('controller.website')}:</strong> www.saimniekapirts.lv</p>
                  <p><strong>{t('controller.email')}:</strong> info@saimniekapirts.lv</p>
                  <p><strong>{t('controller.phone')}:</strong> +371 26752661‬</p>
                </div>
              </div>

              {/* Data Classification */}
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-white mb-6">{t('dataClassification.title')}</h3>
                <p className="text-lg text-gray-300 leading-relaxed mb-6">
                  {t('dataClassification.description')}
                </p>
                <ul className="list-disc pl-6 space-y-3 text-gray-300">
                  {t('dataClassification.types', { returnObjects: true }).map((type: string, index: number) => (
                    <li key={index} className="leading-relaxed">{type}</li>
                  ))}
                </ul>
              </div>

              {/* Processing Purposes */}
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-white mb-6">{t('processingPurposes.title')}</h3>
                <ul className="list-disc pl-6 space-y-3 text-gray-300">
                  {t('processingPurposes.purposes', { returnObjects: true }).map((purpose: string, index: number) => (
                    <li key={index} className="leading-relaxed">{purpose}</li>
                  ))}
                </ul>
              </div>

              {/* Legal Basis */}
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-white mb-6">{t('legalBasis.title')}</h3>
                <p className="text-lg text-gray-300 leading-relaxed">
                  {t('legalBasis.description')}
                </p>
              </div>

              {/* Data Access */}
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-white mb-6">{t('dataAccess.title')}</h3>
                <p className="text-lg text-gray-300 leading-relaxed">
                  {t('dataAccess.description')}
                </p>
              </div>

              {/* Data Subject Rights */}
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-white mb-6">{t('dataSubjectRights.title')}</h3>
                <p className="text-lg text-gray-300 leading-relaxed mb-6">
                  {t('dataSubjectRights.description')}
                </p>
                <div className="mb-6">
                  <h4 className="text-xl font-semibold text-green-400 mb-4">{t('dataSubjectRights.requestMethods.title')}</h4>
                  <ul className="list-disc pl-6 space-y-3 text-gray-300">
                    {t('dataSubjectRights.requestMethods.methods', { returnObjects: true }).map((method: string, index: number) => (
                      <li key={index} className="leading-relaxed">{method}</li>
                    ))}
                  </ul>
                </div>
                <p className="text-lg text-gray-300 leading-relaxed">
                  {t('dataSubjectRights.additionalInfo')}
                </p>
              </div>

              {/* Data Retention */}
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-white mb-6">{t('dataRetention.title')}</h3>
                <p className="text-lg text-gray-300 leading-relaxed mb-6">
                  {t('dataRetention.description')}
                </p>
                <ul className="list-disc pl-6 space-y-3 text-gray-300">
                  {t('dataRetention.criteria', { returnObjects: true }).map((criterion: string, index: number) => (
                    <li key={index} className="leading-relaxed">{criterion}</li>
                  ))}
                </ul>
                <p className="text-lg text-gray-300 leading-relaxed mt-6">
                  {t('dataRetention.deletion')}
                </p>
              </div>

              {/* Data Security */}
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-white mb-6">{t('dataSecurity.title')}</h3>
                <p className="text-lg text-gray-300 leading-relaxed mb-6">
                  {t('dataSecurity.description')}
                </p>
                <ul className="list-disc pl-6 space-y-3 text-gray-300">
                  {t('dataSecurity.principles', { returnObjects: true }).map((principle: string, index: number) => (
                    <li key={index} className="leading-relaxed">{principle}</li>
                  ))}
                </ul>
                <p className="text-lg text-gray-300 leading-relaxed mt-6">
                  {t('dataSecurity.measures')}
                </p>
              </div>

              {/* Video Surveillance */}
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-white mb-6">{t('videoSurveillance.title')}</h3>
                <p className="text-lg text-gray-300 leading-relaxed">
                  {t('videoSurveillance.description')}
                </p>
              </div>

              {/* Communication */}
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-white mb-6">{t('communication.title')}</h3>
                <p className="text-lg text-gray-300 leading-relaxed">
                  {t('communication.description')}
                </p>
              </div>

              {/* Cookies */}
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-white mb-6">{t('cookies.title')}</h3>
                <p className="text-lg text-gray-300 leading-relaxed mb-6">
                  {t('cookies.description')}
                </p>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xl font-semibold text-green-400 mb-3">{t('cookies.analytical.title')}</h4>
                    <p className="text-gray-300 leading-relaxed">{t('cookies.analytical.description')}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-xl font-semibold text-green-400 mb-3">{t('cookies.technical.title')}</h4>
                    <p className="text-gray-300 leading-relaxed">{t('cookies.technical.description')}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-xl font-semibold text-green-400 mb-3">{t('cookies.advertising.title')}</h4>
                    <p className="text-gray-300 leading-relaxed">{t('cookies.advertising.description')}</p>
                  </div>
                </div>

                <p className="text-lg text-gray-300 leading-relaxed mt-6">
                  {t('cookies.thirdParty')}
                </p>
                
                <p className="text-lg text-gray-300 leading-relaxed mt-6">
                  {t('cookies.consent')}
                </p>
                
                <p className="text-lg text-gray-300 leading-relaxed mt-6">
                  {t('cookies.identification')}
                </p>
              </div>

              {/* Policy Changes */}
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-white mb-6">{t('policyChanges.title')}</h3>
                <p className="text-lg text-gray-300 leading-relaxed">
                  {t('policyChanges.description')}
                </p>
              </div>

              {/* Important Notice Box */}
              <div className="bg-gradient-to-r from-blue-600/20 to-green-600/20 border-l-4 border-blue-500 rounded-xl p-6">
                <div className="flex items-center gap-4">
                  <Shield className="w-8 h-8 text-blue-400 flex-shrink-0" />
                  <p className="text-lg font-semibold text-blue-100">
                    {t('notice')}
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

export default PrivacyPolicyPage;