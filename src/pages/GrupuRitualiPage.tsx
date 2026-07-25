import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import HeaderSection from '../components/HeaderSection';
import FooterSection from '../components/FooterSection';
import GrupuRitualsTabs from '../components/grupuRituali/GrupuRitualsTabs';
import GrupuPirtsMeistaru from '../components/grupuRituali/GrupuPirtsMeistaru';
import GrupuPirtsDraugu from '../components/grupuRituali/GrupuPirtsDraugu';
import GrupuPirtsDrauguPlus from '../components/grupuRituali/GrupuPirtsDrauguPlus';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type TabType = 'meistaru' | 'draugu' | 'draugu-plus';

const GrupuRitualiPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('meistaru');
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation('groupRituals');

  // Auto-load selected tab from router state
  useEffect(() => {
    const state = location.state as { tab?: TabType } | null;
    if (state?.tab) {
      setActiveTab(state.tab);
    }
    setIsVisible(true);
    
    // Scroll to top on load
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.state]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handleBackClick = () => {
    navigate('/pirts-rituali');
  };

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'meistaru':
        return <GrupuPirtsMeistaru />;
      case 'draugu':
        return <GrupuPirtsDraugu />;
      case 'draugu-plus':
        return <GrupuPirtsDrauguPlus />;
      default:
        return <GrupuPirtsMeistaru />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <HeaderSection />
      
      <main className="pt-20">
        {/* Hero Section with Back Button */}
        <section className="py-20 px-6 max-w-7xl mx-auto">
          <div className={`transform transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
          }`}>
            {/* Back Button */}
            <div className="mb-8">
              <button
                onClick={handleBackClick}
                className="flex items-center gap-3 text-gray-300 hover:text-green-400 transition-colors duration-300 group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
                <span className="text-lg">Atpakaļ uz Pirts Rituāliem</span>
              </button>
            </div>

            <div className="text-center mb-16">
              <h1 className="text-4xl lg:text-6xl font-bold text-white mb-8">
                {t('hero.title')}
              </h1>
              <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                {t('hero.subtitle')}
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className={`transform transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
          }`} style={{ transitionDelay: '200ms' }}>
            <GrupuRitualsTabs 
              activeTab={activeTab} 
              onTabChange={handleTabChange} 
            />
          </div>
        </section>

        {/* Tab Content */}
        <section className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`} style={{ transitionDelay: '400ms' }}>
          {renderActiveTabContent()}
        </section>
      </main>

      <FooterSection />
    </div>
  );
};

export default GrupuRitualiPage;