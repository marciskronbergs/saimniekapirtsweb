import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { seoManager } from '../utils/seoManager';

export const useSEO = () => {
  const location = useLocation();
  const { i18n } = useTranslation();

  useEffect(() => {
    const currentLanguage = i18n.language as 'lv' | 'en';
    seoManager.updateSEO(location.pathname, currentLanguage);
  }, [location.pathname, i18n.language]);

  return {
    updateSEO: (pathname: string, language: 'lv' | 'en') => {
      seoManager.updateSEO(pathname, language);
    }
  };
};