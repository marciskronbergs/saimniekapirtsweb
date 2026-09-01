import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import i18n from './i18n/i18n';
import { languageFromPath, routerBasename } from './utils/locale';

// The address decides the language, so a shared or indexed English link opens
// in English. With "/en" as the basename the routes themselves stay unchanged.
const { pathname } = window.location;
i18n.changeLanguage(languageFromPath(pathname));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={routerBasename(pathname)}>
      <App />
    </BrowserRouter>
  </StrictMode>
);
