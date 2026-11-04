import React, { Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useSEO } from './hooks/useSEO';
import { useCustomPopup } from './hooks/useCustomPopup';
import PopupWrapper from './components/popup/PopupWrapper';
import StickyRezervetButton from './components/shared/StickyRezervetButton';
import CookieConsent from './components/shared/CookieConsent';

// Each page is a chunk of its own, so a visitor downloads the page they came
// to rather than the whole site (the office pages included) before anything
// shows. Once that page is up, the other public pages are fetched while the
// browser is idle, so moving between them is as instant as before.
const pages = {
  home: () => import('./components/HomePage'),
  rituali: () => import('./pages/PirtsRitualiPage'),
  noma: () => import('./pages/PirtsNomaPage'),
  ipasie: () => import('./pages/IpasiePiedzivvojumiPage'),
  naksnosana: () => import('./pages/NaksnosanaPage'),
  davanuKartes: () => import('./pages/DavanuKartesPage'),
  rezervet: () => import('./pages/RezervetPage'),
  noteikumi: () => import('./pages/IeksejasKartibasNoteikumiPage'),
  privatums: () => import('./pages/PrivacyPolicyPage'),
  grupuRituali: () => import('./pages/GrupuRitualiPage'),
  faq: () => import('./pages/FaqPage'),
  notFound: () => import('./pages/NotFoundPage'),
};
const HomePage = lazy(pages.home);
const PirtsRitualiPage = lazy(pages.rituali);
const PirtsNomaPage = lazy(pages.noma);
const IpasiePiedzivvojumiPage = lazy(pages.ipasie);
const NaksnosanaPage = lazy(pages.naksnosana);
const DavanuKartesPage = lazy(pages.davanuKartes);
const RezervetPage = lazy(pages.rezervet);
const IeksejasKartibasNoteikumiPage = lazy(pages.noteikumi);
const PrivacyPolicyPage = lazy(pages.privatums);
const GrupuRitualiPage = lazy(pages.grupuRituali);
const FaqPage = lazy(pages.faq);
const NotFoundPage = lazy(pages.notFound);
// The office's pages: only ever loaded by the office.
const RekinsPage = lazy(() => import('./pages/RekinsPage'));
const BirojsPage = lazy(() => import('./pages/BirojsPage'));
const PirtnieksPage = lazy(() => import('./pages/PirtnieksPage'));
const ApmaksaPage = lazy(() => import('./pages/ApmaksaPage'));

// Fetches the public pages once the first one has loaded and the browser has
// nothing better to do.
const usePrefetchPages = () => {
  useEffect(() => {
    const ric = (window as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback?.bind(window);
    const idle = (cb: () => void) => (ric ? ric(cb, { timeout: 4000 }) : setTimeout(cb, 2500));
    const start = () => idle(() => Object.values(pages).forEach((load) => load().catch(() => {})));
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
    return () => window.removeEventListener('load', start);
  }, []);
};

// While a page's chunk arrives: the site's dark background, so nothing
// flashes white or jumps.
const PageFallback = () => <div className="min-h-screen bg-[#0a0a0a]" aria-busy="true" />;

// Create a global popup context
export const PopupContext = React.createContext<{
  openCustomPopup: (type: 'noma' | 'ritual', choice?: string) => void;
  closeCustomPopup: () => void;
  isPopupOpen: boolean;
} | null>(null);

// A new page opens at its top. At once, before it is painted: a smooth
// scroll would first show the new page at the old one's depth (from the
// footer, thousands of pixels down) and then run up through all of it.
const ScrollToTop = () => {
  const location = useLocation();

  React.useLayoutEffect(() => {
    // Unless the navigation asked to stay put (switching tabs on Īpašie
    // Pirts Piedzīvojumi changes the address too).
    const keepScroll = (location.state as { keepScroll?: boolean } | null)?.keepScroll;
    if (!keepScroll) window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    
    // Clear any hash fragments unless they're intentional scroll anchors
    if (window.location.hash && !window.location.hash.startsWith('#scroll-')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    // Only a change of page scrolls; the state is read for that navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return null;
};

function App() {
  // Initialize SEO management
  useSEO();
  usePrefetchPages();
  
  // Initialize custom popup
  const { isOpen, formType, preset, openCustomPopup, closeCustomPopup } = useCustomPopup();
  
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
    <PopupContext.Provider value={{ openCustomPopup, closeCustomPopup, isPopupOpen: isOpen }}>
      <ScrollToTop />
      <StickyRezervetButton openCustomPopup={openCustomPopup} />
      <CookieConsent />
      <PopupWrapper 
        isOpen={isOpen} 
        onClose={closeCustomPopup} 
        formType={formType} 
        preset={preset}
      />
      <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/pirts-rituali" element={<PirtsRitualiPage />} />
        <Route path="/pirts-noma" element={<PirtsNomaPage />} />
        <Route path="/ipasiie-piedzivvojumi" element={<IpasiePiedzivvojumiPage />} />
        <Route path="/vecmeitas-purs" element={<IpasiePiedzivvojumiPage initial="vecmeitas" />} />
        <Route path="/viru-paka" element={<IpasiePiedzivvojumiPage initial="viru" />} />
        <Route path="/naksnosana" element={<NaksnosanaPage />} />
        <Route path="/davanu-kartes" element={<DavanuKartesPage />} />
        <Route path="/rezervet" element={<RezervetPage />} />
        <Route path="/ieksejas-kartibas-noteikumi" element={<IeksejasKartibasNoteikumiPage />} />
        <Route path="/privatuma-politika" element={<PrivacyPolicyPage />} />
        <Route path="/grupu-rituali" element={<GrupuRitualiPage />} />
        <Route path="/biezak-uzdotie-jautajumi" element={<FaqPage />} />
        <Route path="/rekins" element={<RekinsPage />} />
        <Route path="/birojs" element={<BirojsPage />} />
        <Route path="/pirtnieks" element={<PirtnieksPage />} />
        <Route path="/apmaksa" element={<ApmaksaPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </Suspense>
    </PopupContext.Provider>
  );
}

export default App;