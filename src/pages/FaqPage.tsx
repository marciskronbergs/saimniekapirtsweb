import { useState } from 'react';
import HeaderSection from '../components/HeaderSection';
import FooterSection from '../components/FooterSection';
import { HelpCircle, ChevronDown, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqGroup {
  title: string;
  items: FaqItem[];
}

const FaqPage = () => {
  const { t } = useTranslation('faq');
  const groups = t('groups', { returnObjects: true }) as FaqGroup[];

  // Answers stay in the markup whether or not a panel is open, so the page
  // reads the same to a crawler as it does to someone who expanded every row.
  const [openKey, setOpenKey] = useState<string | null>('0-0');

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <HeaderSection />

      <main className="pt-20">
        <section className="py-24 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-green-600/20 rounded-full flex items-center justify-center">
                <HelpCircle className="w-10 h-10 text-green-400" />
              </div>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-8 tracking-tight">
              {t('title')}
            </h1>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              {t('subtitle')}
            </p>
          </div>

          <div className="max-w-5xl mx-auto space-y-10">
            {Array.isArray(groups) &&
              groups.map((group, groupIndex) => (
                <div
                  key={group.title}
                  className="bg-[#132d13] rounded-3xl p-6 lg:p-10 shadow-xl shadow-green-500/10"
                >
                  <h2 className="text-2xl lg:text-3xl font-bold text-white mb-8">
                    {group.title}
                  </h2>

                  <div className="space-y-4">
                    {group.items.map((item, itemIndex) => {
                      const key = `${groupIndex}-${itemIndex}`;
                      const isOpen = openKey === key;

                      return (
                        <div
                          key={item.question}
                          className="border border-green-900/60 rounded-2xl overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() => setOpenKey(isOpen ? null : key)}
                            aria-expanded={isOpen}
                            className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 min-h-[48px] hover:bg-green-900/20 transition-colors"
                          >
                            <h3 className="text-lg font-semibold text-white">
                              {item.question}
                            </h3>
                            <ChevronDown
                              className={`w-5 h-5 flex-shrink-0 text-green-400 transition-transform ${
                                isOpen ? 'rotate-180' : ''
                              }`}
                            />
                          </button>

                          <div className={isOpen ? 'block' : 'hidden'}>
                            <p className="px-5 pb-5 text-gray-300 leading-relaxed">
                              {item.answer}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

            <div className="text-center pt-4">
              <a
                href="tel:+37126752661"
                className="inline-flex items-center gap-3 bg-green-600 hover:bg-green-500 text-white font-semibold px-8 py-4 rounded-full transition-colors"
              >
                <Phone className="w-5 h-5" />
                +371 26 752 661
              </a>
            </div>
          </div>
        </section>
      </main>

      <FooterSection />
    </div>
  );
};

export default FaqPage;
