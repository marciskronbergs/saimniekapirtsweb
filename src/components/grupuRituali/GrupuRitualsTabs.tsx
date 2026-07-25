import React from 'react';
import { TabType } from '../../pages/GrupuRitualiPage';
import { useTranslation } from 'react-i18next';

interface GrupuRitualsTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const GrupuRitualsTabs: React.FC<GrupuRitualsTabsProps> = ({ activeTab, onTabChange }) => {
  const { t } = useTranslation('groupRituals');

  const tabs = [
    {
      id: 'meistaru' as TabType,
      name: t('meistaru.cardTitle'),
      price: t('meistaru.price').split(' ')[0]
    },
    {
      id: 'draugu' as TabType,
      name: t('draugu.cardTitle'),
      price: t('draugu.price').split(' ')[0]
    },
    {
      id: 'draugu-plus' as TabType,
      name: t('draugu-plus.cardTitle'),
      price: t('draugu-plus.price').split(' ')[0]
    }
  ];

  return (
    <div className="mb-12">
      <div className="flex justify-center mb-8">
        <div className="bg-[#132d13] rounded-2xl p-4 max-w-full overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center px-6 py-4 rounded-xl font-semibold transition-all duration-500 whitespace-nowrap min-w-[200px] relative overflow-hidden group ${
                  activeTab === tab.id
                    ? 'bg-green-600 text-white shadow-lg shadow-green-500/25 scale-105 transform'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50 hover:scale-102 transform'
                }`}
              >
                {/* Glowing background effect for active tab */}
                {activeTab === tab.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 via-green-500/30 to-green-600/20 animate-pulse"></div>
                )}
                
                {/* Hover glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/0 via-green-500/10 to-green-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative z-10">
                  <span className={`text-2xl font-bold mb-2 block ${
                    activeTab === tab.id ? 'text-white' : 'text-green-400'
                  }`}>
                    {tab.price}
                  </span>
                  <span className="text-sm text-center leading-tight">
                    {tab.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrupuRitualsTabs;