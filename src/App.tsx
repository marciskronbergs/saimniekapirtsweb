import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useSEO } from './hooks/useSEO';
import { useCustomPopup } from './hooks/useCustomPopup';
import PopupWrapper from './components/popup/PopupWrapper';
import StickyRezervetButton from './components/shared/StickyRezervetButton';
import HomePage from './components/HomePage';
import PirtsRitualiPage from './pages/PirtsRitualiPage';
import PirtsNomaPage from './pages/PirtsNomaPage';
import IpasiePiedzivvojumiPage from './pages/IpasiePiedzivvojumiPage';
import VecmeitasPursPage from './pages/VecmeitasPursPage';
import ViruPakaPage from './pages/ViruPakaPage';
import NaksnosanaPage from './pages/NaksnosanaPage';
import DavanuKartesPage from './pages/DavanuKartesPage';
import RezervetPage from './pages/RezervetPage';
import IeksejasKartibasNoteikumiPage from './pages/IeksejasKartibasNoteikumiPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import GrupuRitualiPage from './pages/GrupuRitualiPage';
import FaqPage from './pages/FaqPage';

// Create a global popup context
export const PopupContext = React.createContext<{
  openCustomPopup: (type: 'noma' | 'ritual') => void;
  closeCustomPopup: () => void;
} | null>(null);

// Component to handle scroll to top on route change
const ScrollToTop = () => {
  const location = useLocation();

  React.useEffect(() => {
    // Scroll to top on route change
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Clear any hash fragments unless they're intentional scroll anchors
    if (window.location.hash && !window.location.hash.startsWith('#scroll-')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, [location.pathname]);

  return null;
};

function App() {
  // Initialize SEO management
  useSEO();
  
  // Initialize custom popup
  const { isOpen, formType, openCustomPopup, closeCustomPopup } = useCustomPopup();
  
  // Make popup functions available globally
  useEffect(() => {
    (window as any).openCustomPopup = openCustomPopup;
    (window as any).closeCustomPopup = closeCustomPopup;
    
    return () => {
      delete (window as any).openCustomPopup;
      delete (window as any).closeCustomPopup;
    };
  }, [openCustomPopup, closeCustomPopup]);

  return (
    <PopupContext.Provider value={{ openCustomPopup, closeCustomPopup }}>
      <ScrollToTop />
      <StickyRezervetButton openCustomPopup={openCustomPopup} />
      <PopupWrapper 
        isOpen={isOpen} 
        onClose={closeCustomPopup} 
        formType={formType} 
      />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/pirts-rituali" element={<PirtsRitualiPage />} />
        <Route path="/pirts-noma" element={<PirtsNomaPage />} />
        <Route path="/ipasiie-piedzivvojumi" element={<IpasiePiedzivvojumiPage />} />
        <Route path="/vecmeitas-purs" element={<VecmeitasPursPage />} />
        <Route path="/viru-paka" element={<ViruPakaPage />} />
        <Route path="/naksnosana" element={<NaksnosanaPage />} />
        <Route path="/davanu-kartes" element={<DavanuKartesPage />} />
        <Route path="/rezervet" element={<RezervetPage />} />
        <Route path="/ieksejas-kartibas-noteikumi" element={<IeksejasKartibasNoteikumiPage />} />
        <Route path="/privatuma-politika" element={<PrivacyPolicyPage />} />
        <Route path="/grupu-rituali" element={<GrupuRitualiPage />} />
        <Route path="/biezak-uzdotie-jautajumi" element={<FaqPage />} />
      </Routes>
    </PopupContext.Provider>
  );
}

export default App;