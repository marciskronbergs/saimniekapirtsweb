import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { seoManager } from '../utils/seoManager';
import { asLanguage, type Language } from '../utils/locale';

export const useSEO = () => {
  const location = useLocation();
  const { i18n } = useTranslation();

  useEffect(() => {
    const currentLanguage = asLanguage(i18n.language);
    seoManager.updateSEO(location.pathname, currentLanguage);
  }, [location.pathname, i18n.language]);

  return {
    updateSEO: (pathname: string, language: Language) => {
      seoManager.updateSEO(pathname, language);
    }
  };
};