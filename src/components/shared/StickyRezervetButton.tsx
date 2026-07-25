import React from 'react';
import { useLocation } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface StickyRezervetButtonProps {
  openCustomPopup: (type: 'noma' | 'ritual') => void;
}

const StickyRezervetButton: React.FC<StickyRezervetButtonProps> = ({ openCustomPopup }) => {
  const location = useLocation();
  const { t } = useTranslation('common');
  
  // Define which pages should show the button
  const shouldShowButton = () => {
    const path = location.pathname;
    return (
      path.startsWith('/pirts-rituali') ||
      path.startsWith('/ipasiie-piedzivvojumi') ||
      path.startsWith('/vecmeitas-purs') ||
      path.startsWith('/viru-paka') ||
      path.startsWith('/grupu-rituali') ||
      path === '/pirts-noma'
    );
  };

  const handleReservationRedirect = () => {
    const path = location.pathname;
    if (path === '/pirts-noma') {
      openCustomPopup('noma');
    } else {
      openCustomPopup('ritual');
    }
  };

  // Don't render if not on target pages
  if (!shouldShowButton()) {
    return null;
  }

  return (
    <button
      onClick={handleReservationRedirect}
      className="fixed bottom-4 right-4 z-50 bg-gradient-to-r from-green-500 to-lime-500 text-white font-semibold py-3 px-4 sm:px-6 rounded-full shadow-lg hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-green-400/40 flex items-center gap-2 group min-h-[48px] cursor-pointer"
      aria-label={t('reserve')}
    >
      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform duration-300" />
      <span className="text-sm sm:text-base">{t('reserve')}</span>
      
      {/* Subtle pulse animation */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 to-lime-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
    </button>
  );
};

export default StickyRezervetButton;