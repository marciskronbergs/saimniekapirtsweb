import { Link } from 'react-router-dom';
import { Compass, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import HeaderSection from '../components/HeaderSection';
import FooterSection from '../components/FooterSection';
import { useOfficePage } from '../lib/officeApi';
import { getCurrentPageSEO } from '../utils/seoData';
import { asLanguage } from '../utils/locale';

// The places a visitor who followed a dead link most likely wanted. Their names
// come from the same SEO table as the page titles, so they cannot drift.
const SUGGESTED = [
  '/pirts-rituali',
  '/grupu-rituali',
  '/pirts-noma',
  '/naksnosana',
  '/davanu-kartes',
  '/biezak-uzdotie-jautajumi',
];

const NotFoundPage = () => {
  const { t, i18n } = useTranslation('common');
  const language = asLanguage(i18n.language);

  // Netlify already answers an unknown address with a 404 status; this keeps
  // the same view out of the index when it is reached by navigating in the app.
  useOfficePage(t('notFound.title'));

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <HeaderSection />

      <main className="pt-20">
        <section className="py-24 px-6 max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-green-600/20 rounded-full flex items-center justify-center">
              <Compass className="w-10 h-10 text-green-400" />
            </div>
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold text-white mb-8 tracking-tight">
            {t('notFound.title')}
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed mb-12">
            {t('notFound.text')}
          </p>

          <ul className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-12 text-left">
            {SUGGESTED.map((path) => (
              <li key={path}>
                <Link
                  to={path}
                  className="flex items-center justify-between gap-4 bg-[#132d13] rounded-2xl px-6 py-4 text-white hover:bg-[#1a3d1a] transition-colors"
                >
                  <span>{getCurrentPageSEO(path, language).title.split(' - ')[0]}</span>
                  <ArrowRight className="w-5 h-5 text-green-400 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>

          <Link
            to="/"
            className="inline-block bg-green-600 hover:bg-green-500 text-white font-semibold rounded-full px-8 py-4 transition-colors"
          >
            {t('notFound.home')}
          </Link>
        </section>
      </main>

      <FooterSection />
    </div>
  );
};

export default NotFoundPage;
