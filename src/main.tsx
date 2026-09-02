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

const app = (
  <StrictMode>
    <BrowserRouter basename={routerBasename(pathname)}>
      <App />
    </BrowserRouter>
  </StrictMode>
);

const root = createRoot(document.getElementById('root')!);

// The phone preview is a development aid. The condition is replaced by `false`
// when building, so the module below is dropped from the production bundle.
const insidePreviewFrame = new URLSearchParams(window.location.search).has('__frame');

if (import.meta.env.DEV && !insidePreviewFrame) {
  import('./dev/DevicePreviewShell').then(({ default: DevicePreviewShell }) => {
    root.render(<DevicePreviewShell>{app}</DevicePreviewShell>);
  });
} else {
  root.render(app);
}
