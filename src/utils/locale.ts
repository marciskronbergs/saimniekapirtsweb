// Language lives in the URL: Latvian at /pirts-noma, English at /en/pirts-noma,
// Russian at /ru/pirts-noma.
//
// Before this, both languages shared one URL and the visitor's choice lived
// only in memory. That left the other languages impossible to link to,
// impossible to index, and invisible to the assistants people ask in them --
// while the hreflang tags claimed variants that were all the same address.
//
// The router runs with the language prefix as its basename, so every existing
// <Link to="/pirts-noma"> and navigate('/pirts-noma') resolves to the address
// in the current language on its own. Route paths stay Latvian in the code.

export const LANGUAGES = ['lv', 'en', 'ru'] as const
export type Language = (typeof LANGUAGES)[number]

export const DEFAULT_LANGUAGE: Language = 'lv'
export const ORIGIN = 'https://saimniekapirts.lv'

/** The path prefix of each language; Latvian, the default, has none. */
const PREFIX: Record<Language, string> = { lv: '', en: '/en', ru: '/ru' }
export const EN_PREFIX = PREFIX.en

/** A value that may be a language code, narrowed to one we serve. */
export const asLanguage = (value: unknown): Language =>
  (LANGUAGES as readonly unknown[]).includes(value) ? (value as Language) : DEFAULT_LANGUAGE

export function languageFromPath(pathname: string): Language {
  for (const language of LANGUAGES) {
    const prefix = PREFIX[language]
    if (prefix && (pathname === prefix || pathname.startsWith(`${prefix}/`))) return language
  }
  return DEFAULT_LANGUAGE
}

/** What BrowserRouter should treat as the root for this URL. */
export function routerBasename(pathname: string): string {
  return PREFIX[languageFromPath(pathname)] || '/'
}

/** The route path with any language prefix and trailing slash removed. */
export function routePathOf(pathname: string): string {
  const withoutPrefix = pathname.slice(PREFIX[languageFromPath(pathname)].length)
  const trimmed = withoutPrefix.replace(/\/+$/, '')
  return trimmed === '' ? '/' : trimmed
}

/** Where a route lives in a given language. */
export function pathForLanguage(routePath: string, language: Language): string {
  const clean = routePath === '/' ? '' : routePath.replace(/\/+$/, '')
  const prefix = PREFIX[language]
  if (prefix) return clean ? `${prefix}${clean}` : prefix
  return clean || '/'
}

export function urlForLanguage(routePath: string, language: Language): string {
  return ORIGIN + pathForLanguage(routePath, language)
}
