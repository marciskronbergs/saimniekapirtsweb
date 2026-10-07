import { getCurrentPageSEO, hasPageSEO } from './seoData';
import { LANGUAGES, routePathOf, urlForLanguage, type Language } from './locale';

const OG_LOCALE: Record<Language, string> = { lv: 'lv_LV', en: 'en_US', ru: 'ru_RU' };

export class SEOManager {
  private static instance: SEOManager;
  private currentLanguage: Language = 'lv';

  private constructor() {}

  public static getInstance(): SEOManager {
    if (!SEOManager.instance) {
      SEOManager.instance = new SEOManager();
    }
    return SEOManager.instance;
  }

  public updateSEO(pathname: string, language: Language): void {
    // The office's pages set their own title and noindex, and have nothing
    // for search engines.
    if (/^\/(rekins|birojs|pirtnieks|apmaksa)\/?$/.test(pathname)) return;
    // Nor does the not-found view, which an unknown address would otherwise
    // dress in the homepage's title and a canonical pointing at itself. It
    // still speaks the visitor's language.
    if (!hasPageSEO(pathname)) {
      document.documentElement.lang = language;
      return;
    }
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
    this.updateMetaTag('property', 'og:locale', OG_LOCALE[language]);

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

  private updateCanonicalURL(pathname: string, language: Language): void {
    // pathname comes from the router, so it never carries the /en or /ru basename --
    // it is the route on its own, which is exactly what the URL helpers want.
    const routePath = routePathOf(pathname);

    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;

    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }

    canonicalLink.href = urlForLanguage(routePath, language);

    this.updateAlternates(routePath);
  }

  /**
   * Each language now has its own address, so the two can finally point at each
   * other. The previous markup declared lv, en and x-default as three names for
   * one URL, which told search engines nothing about the English pages.
   */
  private updateAlternates(routePath: string): void {
    const alternates: Array<[string, string]> = [
      ...LANGUAGES.map((language): [string, string] => [language, urlForLanguage(routePath, language)]),
      ['x-default', urlForLanguage(routePath, 'lv')],
    ];

    for (const [hreflang, href] of alternates) {
      let link = document.querySelector(
        `link[rel="alternate"][hreflang="${hreflang}"]`
      ) as HTMLLinkElement;

      if (!link) {
        link = document.createElement('link');
        link.rel = 'alternate';
        link.hreflang = hreflang;
        document.head.appendChild(link);
      }

      link.href = href;
    }
  }

  public getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  // Initialize SEO on page load
  public initializeSEO(pathname: string, initialLanguage: Language = 'lv'): void {
    this.updateSEO(pathname, initialLanguage);
  }
}

// Export singleton instance
export const seoManager = SEOManager.getInstance();