// Writes a real HTML document for every route into dist/.
//
// The app is a client-rendered SPA behind a catch-all rewrite, so until now
// every URL returned the same shell: one <div id="root"></div>, the homepage's
// title, and a canonical pointing at the homepage. Search engines that run
// JavaScript eventually see the rendered page, but the crawlers behind the AI
// assistants -- GPTBot, ClaudeBot, PerplexityBot, CCBot and friends -- mostly
// do not execute JavaScript. They were reading an empty page, which is why the
// site cannot be quoted by them at all.
//
// This script does not render React. It writes, per route, the head a crawler
// needs plus a static summary of the page built from the same translation
// files the app itself uses, so the text can never drift from the site. React
// replaces that markup the moment it mounts, so visitors see no difference.
//
// Run after `npm run build`:  node scripts/prerender.mjs

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { build } from 'esbuild'

const DIST = 'dist'
const ORIGIN = 'https://saimniekapirts.lv'
const LOCALES = 'src/i18n/locales/lv'

const BUSINESS = {
  name: 'SaimniekaPirts',
  phone: '+371-26-752-661',
  email: 'info@saimniekapirts.lv',
  street: 'Sarma Nr. 123, Baldones pagasts',
  locality: 'Ķekavas novads',
  postal: 'LV-2125',
  country: 'LV',
  lat: 56.6841314,
  lon: 24.2903839,
  hours: 'Mo-Su 09:00-22:00',
  logo: 'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/logo/logoTitle.png',
}

// Which translation file describes each route, and what kind of thing it is.
// `service: true` routes get Service + Offer markup; the rest stay informational.
const ROUTES = [
  { path: '/', ns: ['hero', 'cards'], home: true },
  { path: '/pirts-rituali', ns: ['rituali'], service: true },
  { path: '/grupu-rituali', ns: ['groupRituals'], service: true },
  { path: '/pirts-noma', ns: ['noma'], service: true },
  { path: '/ipasiie-piedzivvojumi', ns: ['special'], service: true },
  { path: '/vecmeitas-purs', ns: ['vecmeitas'], service: true },
  { path: '/viru-paka', ns: ['viru'], service: true },
  { path: '/naksnosana', ns: ['accommodation'], service: true },
  { path: '/davanu-kartes', ns: ['giftcards'], service: true },
  { path: '/rezervet', ns: ['reserve'] },
  { path: '/ieksejas-kartibas-noteikumi', ns: ['rules'], noindexHint: true },
  { path: '/privatuma-politika', ns: ['privacy'], noindexHint: true },
]

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/** Load the app's own SEO table so titles never diverge from the running app. */
async function loadSeoData() {
  const out = await build({
    entryPoints: ['src/utils/seoData.ts'],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
    logLevel: 'silent',
  })
  const code = out.outputFiles[0].text
  const mod = await import(
    'data:text/javascript;base64,' + Buffer.from(code).toString('base64')
  )
  return mod.seoData
}

function loadNamespace(name) {
  try {
    return JSON.parse(readFileSync(join(LOCALES, `${name}.json`), 'utf8'))
  } catch {
    return null
  }
}

/**
 * Turn a translation namespace into headings, paragraphs and lists.
 * Keys named title/subtitle/description/price carry the meaning in these files,
 * so the shape of the JSON is enough -- no per-page copy is written here.
 */
function renderNamespace(data, depth = 2) {
  const out = []
  const heading = Math.min(depth, 6)

  const walk = (node, level) => {
    if (typeof node === 'string') {
      if (node.trim()) out.push(`<p>${esc(node)}</p>`)
      return
    }
    if (Array.isArray(node)) {
      const strings = node.filter((v) => typeof v === 'string')
      if (strings.length === node.length && node.length) {
        out.push(
          `<ul>${strings.map((v) => `<li>${esc(v)}</li>`).join('')}</ul>`
        )
        return
      }
      for (const item of node) walk(item, level)
      return
    }
    if (node && typeof node === 'object') {
      if (node.title) {
        const h = Math.min(level, 6)
        out.push(`<h${h}>${esc(node.title)}</h${h}>`)
      }
      for (const key of ['subtitle', 'description', 'quote', 'text']) {
        if (typeof node[key] === 'string' && node[key].trim()) {
          out.push(`<p>${esc(node[key])}</p>`)
        }
      }
      if (node.price || node.priceRange) {
        out.push(`<p><strong>${esc(node.price || node.priceRange)}</strong></p>`)
      }
      for (const [key, value] of Object.entries(node)) {
        if (
          ['title', 'subtitle', 'description', 'quote', 'text', 'price', 'priceRange', 'cta'].includes(key)
        ) {
          continue
        }
        walk(value, level + 1)
      }
    }
  }

  walk(data, heading)
  return out.join('\n      ')
}

/** Collect every price string a namespace mentions, for Offer markup. */
function collectPrices(node, found = []) {
  if (Array.isArray(node)) {
    for (const v of node) collectPrices(v, found)
  } else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if ((k === 'price' || k === 'priceRange') && typeof v === 'string') found.push(v)
      else collectPrices(v, found)
    }
  }
  return found
}

/** Lowest euro figure in a set of price strings like "220€ – 280€". */
function lowestPrice(prices) {
  const numbers = prices
    .flatMap((p) => p.match(/\d+(?:[.,]\d+)?/g) || [])
    .map((n) => Number(n.replace(',', '.')))
    .filter((n) => Number.isFinite(n) && n > 0)
  return numbers.length ? Math.min(...numbers) : null
}

function localBusiness() {
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'HealthAndBeautyBusiness'],
    '@id': `${ORIGIN}/#business`,
    name: BUSINESS.name,
    url: ORIGIN,
    telephone: BUSINESS.phone,
    email: BUSINESS.email,
    image: BUSINESS.logo,
    logo: BUSINESS.logo,
    priceRange: '€€',
    currenciesAccepted: 'EUR',
    address: {
      '@type': 'PostalAddress',
      streetAddress: BUSINESS.street,
      addressLocality: BUSINESS.locality,
      postalCode: BUSINESS.postal,
      addressCountry: BUSINESS.country,
    },
    geo: { '@type': 'GeoCoordinates', latitude: BUSINESS.lat, longitude: BUSINESS.lon },
    openingHours: BUSINESS.hours,
    areaServed: [
      { '@type': 'AdministrativeArea', name: 'Latvia' },
      { '@type': 'City', name: 'Riga' },
      { '@type': 'City', name: 'Baldone' },
    ],
    knowsLanguage: ['lv', 'en'],
  }
}

function schemaFor(route, seo, nsData) {
  const graph = []

  if (route.home) {
    graph.push(localBusiness())
    graph.push({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${ORIGIN}/#website`,
      url: ORIGIN,
      name: BUSINESS.name,
      inLanguage: ['lv', 'en'],
      publisher: { '@id': `${ORIGIN}/#business` },
    })
  } else {
    graph.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Sākums', item: ORIGIN + '/' },
        { '@type': 'ListItem', position: 2, name: seo.title.split(' - ')[0], item: ORIGIN + route.path },
      ],
    })
  }

  if (route.service) {
    const prices = collectPrices(nsData)
    const from = lowestPrice(prices)
    const service = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: seo.title.split(' - ')[0],
      description: seo.description,
      url: ORIGIN + route.path,
      serviceType: seo.title.split(' - ')[0],
      provider: { '@id': `${ORIGIN}/#business` },
      areaServed: { '@type': 'Country', name: 'Latvia' },
    }
    if (from !== null) {
      service.offers = {
        '@type': 'Offer',
        priceCurrency: 'EUR',
        price: String(from),
        availability: 'https://schema.org/InStock',
        url: `${ORIGIN}/rezervet`,
      }
    }
    graph.push(service)
  }

  return graph
}

function documentFor({ route, seo, head, body, schema }) {
  const url = ORIGIN + (route.path === '/' ? '/' : route.path)
  const robots = route.noindexHint
    ? 'noindex, follow'
    : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'

  const tags = [
    `<title>${esc(seo.title)}</title>`,
    `<meta name="description" content="${esc(seo.description)}" />`,
    `<meta name="keywords" content="${esc(seo.keywords)}" />`,
    `<meta name="robots" content="${robots}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:title" content="${esc(seo.ogTitle)}" />`,
    `<meta property="og:description" content="${esc(seo.ogDescription)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:type" content="${route.home ? 'website' : 'article'}" />`,
    `<meta name="twitter:title" content="${esc(seo.twitterTitle)}" />`,
    `<meta name="twitter:description" content="${esc(seo.twitterDescription)}" />`,
    ...schema.map(
      (s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`
    ),
  ].join('\n    ')

  // Replace the shell's homepage-specific tags with this route's own.
  let out = head
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<meta\s+name="description"[^>]*>/g, '')
    .replace(/<meta\s+name="keywords"[^>]*>/g, '')
    .replace(/<meta\s+name="robots"[^>]*>/g, '')
    .replace(/<link\s+rel="canonical"[^>]*>/g, '')
    .replace(/<meta\s+property="og:title"[^>]*>/g, '')
    .replace(/<meta\s+property="og:description"[^>]*>/g, '')
    .replace(/<meta\s+property="og:url"[^>]*>/g, '')
    .replace(/<meta\s+property="og:type"[^>]*>/g, '')
    .replace(/<meta\s+name="twitter:title"[^>]*>/g, '')
    .replace(/<meta\s+name="twitter:description"[^>]*>/g, '')
    // The old cluster pointed every language at the same URL, which says nothing.
    .replace(/<link\s+rel="alternate"[^>]*>/g, '')
    // The homepage LocalBusiness block is replaced by the per-route graph.
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '')
    .replace('</head>', `  ${tags}\n  </head>`)

  return out.replace(
    /<div id="root"><\/div>/,
    `<div id="root">\n      ${body}\n    </div>`
  )
}

// ---------------------------------------------------------------------------

const seoData = await loadSeoData()
const shell = readFileSync(join(DIST, 'index.html'), 'utf8')
const written = []

for (const route of ROUTES) {
  const seo = seoData[route.path]?.lv
  if (!seo) {
    console.error(`  ! no SEO entry for ${route.path}, skipping`)
    continue
  }

  const namespaces = route.ns.map(loadNamespace).filter(Boolean)
  const sections = namespaces.map((n) => renderNamespace(n)).join('\n      ')

  const nav = ROUTES.filter((r) => r.path !== route.path)
    .map((r) => `<li><a href="${r.path}">${esc(seoData[r.path]?.lv.title.split(' - ')[0] ?? r.path)}</a></li>`)
    .join('')

  const body = [
    `<h1>${esc(seo.ogTitle)}</h1>`,
    `<p>${esc(seo.description)}</p>`,
    sections,
    `<h2>Kontakti</h2>`,
    `<address>${esc(BUSINESS.name)}, ${esc(BUSINESS.street)}, ${esc(BUSINESS.locality)}, ${esc(BUSINESS.postal)}, Latvija. ` +
      `Tālrunis: <a href="tel:${BUSINESS.phone.replace(/-/g, '')}">${esc(BUSINESS.phone)}</a>. ` +
      `E-pasts: <a href="mailto:${BUSINESS.email}">${esc(BUSINESS.email)}</a>.</address>`,
    `<nav aria-label="Lapas"><ul>${nav}</ul></nav>`,
  ].join('\n      ')

  const html = documentFor({
    route,
    seo,
    head: shell,
    body,
    schema: schemaFor(route, seo, namespaces),
  })

  const target =
    route.path === '/' ? join(DIST, 'index.html') : join(DIST, route.path, 'index.html')
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, html)
  written.push({ path: route.path, bytes: html.length })
}

// A sitemap generated here can never list a route that was not prerendered.
const today = new Date().toISOString().slice(0, 10)
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemap.org/schemas/sitemap/0.9">'.replace('www.sitemap.org', 'www.sitemaps.org'),
  ...ROUTES.filter((r) => !r.noindexHint).map((r) =>
    [
      '  <url>',
      `    <loc>${ORIGIN}${r.path === '/' ? '/' : r.path}</loc>`,
      `    <lastmod>${today}</lastmod>`,
      `    <changefreq>${r.home ? 'weekly' : 'monthly'}</changefreq>`,
      `    <priority>${r.home ? '1.0' : r.service ? '0.8' : '0.6'}</priority>`,
      '  </url>',
    ].join('\n')
  ),
  '</urlset>',
].join('\n')
writeFileSync(join(DIST, 'sitemap.xml'), sitemap)

// llms.txt is the convention AI assistants are starting to read for a plain
// statement of what a site offers. It costs nothing and is trivial to keep
// accurate, because it is generated from the same table as everything else.
const llms = [
  `# ${BUSINESS.name}`,
  '',
  `> ${seoData['/'].lv.description}`,
  '',
  `${BUSINESS.name} ir tradicionāla latviskā pirts Baldonē, Ķekavas novadā. Pirts rituālus vada sertificēti pirtnieki.`,
  '',
  '## Pakalpojumu lapas',
  '',
  ...ROUTES.filter((r) => !r.noindexHint && !r.home).map(
    (r) => `- [${seoData[r.path].lv.ogTitle}](${ORIGIN}${r.path}): ${seoData[r.path].lv.description}`
  ),
  '',
  '## Kontakti',
  '',
  `- Adrese: ${BUSINESS.street}, ${BUSINESS.locality}, ${BUSINESS.postal}, Latvija`,
  `- Tālrunis: ${BUSINESS.phone}`,
  `- E-pasts: ${BUSINESS.email}`,
  `- Darba laiks: ${BUSINESS.hours}`,
  `- Valodas: latviešu, angļu`,
  '',
].join('\n')
writeFileSync(join(DIST, 'llms.txt'), llms)

console.log(`Prerendered ${written.length} routes:`)
for (const w of written) console.log(`  ${w.path.padEnd(30)} ${w.bytes} bytes`)
console.log('  sitemap.xml and llms.txt regenerated')
