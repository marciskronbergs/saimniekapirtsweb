import { getCurrentPageSEO } from './seoData';

export class SEOManager {
  private static instance: SEOManager;
  private currentLanguage: 'lv' | 'en' = 'lv';

  private constructor() {}

  public static getInstance(): SEOManager {
    if (!SEOManager.instance) {
      SEOManager.instance = new SEOManager();
    }
    return SEOManager.instance;
  }

  public updateSEO(pathname: string, language: 'lv' | 'en'): void {
    this.currentLanguage = language;
    const seoData = getCurrentPageSEO(pathname, language);

    // Update document title
    document.title = seoData.title;

    // Update HTML lang attribute
    document.documentElement.lang = language;

    // Update meta description
    this.updateMetaTag('name', 'description', seoData.description);

    // Update meta keywords
    this.updateMetaTag('name', 'keywords', seoData.keywords);

    // Update Open Graph tags
    this.updateMetaTag('property', 'og:title', seoData.ogTitle);
    this.updateMetaTag('property', 'og:description', seoData.ogDescription);
    this.updateMetaTag('property', 'og:locale', language === 'lv' ? 'lv_LV' : 'en_US');

    // Update Twitter Card tags
    this.updateMetaTag('name', 'twitter:title', seoData.twitterTitle);
    this.updateMetaTag('name', 'twitter:description', seoData.twitterDescription);

    // Update canonical URL (if needed for language-specific URLs)
    this.updateCanonicalURL(pathname, language);
  }

  private updateMetaTag(attribute: string, name: string, content: string): void {
    let metaTag = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
    
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute(attribute, name);
      document.head.appendChild(metaTag);
    }
    
    metaTag.content = content;
  }

  private updateCanonicalURL(pathname: string, language: 'lv' | 'en'): void {
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }

    // Since all content is served on same URLs, canonical remains the same
    const baseURL = 'https://saimniekapirts.lv';
    canonicalLink.href = `${baseURL}${pathname}`;
  }

  public getCurrentLanguage(): 'lv' | 'en' {
    return this.currentLanguage;
  }

  // Initialize SEO on page load
  public initializeSEO(pathname: string, initialLanguage: 'lv' | 'en' = 'lv'): void {
    this.updateSEO(pathname, initialLanguage);
  }
}

// Export singleton instance
export const seoManager = SEOManager.getInstance();