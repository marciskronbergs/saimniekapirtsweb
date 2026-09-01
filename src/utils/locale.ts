// Language lives in the URL: Latvian at /pirts-noma, English at /en/pirts-noma.
//
// Before this, both languages shared one URL and the visitor's choice lived
// only in memory. That left the English side impossible to link to, impossible
// to index, and invisible to the assistants people ask in English -- while the
// hreflang tags claimed three variants that were all the same address.
//
// The router runs with "/en" as its basename on English URLs, so every existing
// <Link to="/pirts-noma"> and navigate('/pirts-noma') resolves to the English
// address on its own. Route paths stay Latvian in the code.

export const LANGUAGES = ['lv', 'en'] as const
export type Language = (typeof LANGUAGES)[number]

export const DEFAULT_LANGUAGE: Language = 'lv'
export const EN_PREFIX = '/en'
export const ORIGIN = 'https://saimniekapirts.lv'

export function languageFromPath(pathname: string): Language {
  return pathname === EN_PREFIX || pathname.startsWith(`${EN_PREFIX}/`)
    ? 'en'
    : DEFAULT_LANGUAGE
}

/** What BrowserRouter should treat as the root for this URL. */
export function routerBasename(pathname: string): string {
  return languageFromPath(pathname) === 'en' ? EN_PREFIX : '/'
}

/** The route path with any language prefix and trailing slash removed. */
export function routePathOf(pathname: string): string {
  const withoutPrefix =
    languageFromPath(pathname) === 'en' ? pathname.slice(EN_PREFIX.length) : pathname
  const trimmed = withoutPrefix.replace(/\/+$/, '')
  return trimmed === '' ? '/' : trimmed
}

/** Where a route lives in a given language. */
export function pathForLanguage(routePath: string, language: Language): string {
  const clean = routePath === '/' ? '' : routePath.replace(/\/+$/, '')
  if (language === 'en') return clean ? `${EN_PREFIX}${clean}` : EN_PREFIX
  return clean || '/'
}

export function urlForLanguage(routePath: string, language: Language): string {
  return ORIGIN + pathForLanguage(routePath, language)
}
