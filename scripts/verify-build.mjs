// Checks that dist/ carries a usable Supabase configuration before it is published.
//
// Vite inlines import.meta.env.VITE_* at build time, so whatever was in the
// environment is frozen into the bundle. Nothing downstream notices a bad
// value: the build compiles, uploads and deploys, and the breakage only shows
// up in the visitor's browser. Two ways that has already happened here:
//
//   1. No variables at all -> createClient() gets undefined.
//   2. The key copied from the Supabase dashboard while still masked, so its
//      characters were literally bullet dots. Those are outside ISO-8859-1,
//      and every request dies in Headers.set() with "String contains non
//      ISO-8859-1 code point".
//
// Run it after `npm run build`:  node scripts/verify-build.mjs

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const DIST = 'dist'
const ASSETS = join(DIST, 'assets')

const problems = []
const fail = (message) => problems.push(message)

let bundle = ''
let bundleName = ''

try {
  const scripts = readdirSync(ASSETS).filter((f) => f.endsWith('.js'))
  if (scripts.length === 0) {
    fail(`No JavaScript bundle found in ${ASSETS}/. Did the build run?`)
  } else {
    // The entry bundle is the one index.html loads; libraries loaded on demand
    // (such as the office page's QR code generator) get chunks of their own.
    let entry = ''
    try {
      entry = readFileSync(join(DIST, 'index.html'), 'utf8').match(/<script[^>]+src="\/?assets\/([^"]+\.js)"/)?.[1] ?? ''
    } catch {
      // Reported below, where index.html is read again.
    }
    bundleName = scripts.includes(entry) ? entry : scripts.find((f) => f.startsWith('index-')) ?? scripts[0]
    bundle = readFileSync(join(ASSETS, bundleName), 'utf8')
  }
} catch {
  fail(`${ASSETS}/ is missing. Run "npm run build" first.`)
}

function describeChar(ch) {
  const point = `U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`
  return ch === '•' ? `${point} (a bullet "•")` : `${point} ("${ch}")`
}

if (bundle) {
  // The placeholders in src/lib/supabase.ts only survive minification when the
  // real values were absent, so finding one is a direct signal.
  if (bundle.includes('unconfigured.invalid')) {
    fail(
      'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY were not set when this ' +
        'build ran. Set them in the Netlify project (Project configuration -> ' +
        'Environment variables, scope "Builds") or in a local .env file.'
    )
  } else {
    if (!/https:\/\/[a-z0-9]+\.supabase\.co/.test(bundle)) {
      fail(
        `No Supabase URL is present in ${bundleName}. Check the value of ` +
          'VITE_SUPABASE_URL.'
      )
    }

    const match = bundle.match(/"(eyJ[^"]{10,1400})"/)
    if (!match) {
      fail(
        `No Supabase key is present in ${bundleName}. Check the value of ` +
          'VITE_SUPABASE_ANON_KEY.'
      )
    } else {
      const key = match[1]

      // A key is base64url text. Anything else means it was mangled on the way
      // in -- most often copied from the dashboard while still masked.
      const foreign = [...key].find((ch) => ch.charCodeAt(0) > 126)
      if (foreign) {
        fail(
          `VITE_SUPABASE_ANON_KEY contains ${describeChar(foreign)}, which a ` +
            'key never does. This is what the masked value in the Supabase ' +
            'dashboard looks like when copied before revealing it. Open ' +
            'Project Settings -> API Keys, reveal the "anon" key, copy it, ' +
            'and set the variable again.'
        )
      } else if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key)) {
        fail(
          'VITE_SUPABASE_ANON_KEY is not a complete JWT (it should be three ' +
            'dot-separated sections). It looks truncated or partly copied.'
        )
      } else {
        try {
          const claims = JSON.parse(
            Buffer.from(key.split('.')[1], 'base64url').toString('utf8')
          )
          if (claims.role && claims.role !== 'anon') {
            fail(
              `VITE_SUPABASE_ANON_KEY carries the "${claims.role}" role, not ` +
                '"anon". This bundle is downloaded by every visitor, so that ' +
                'key would be public. Use the "anon" key.'
            )
          }
        } catch {
          fail('VITE_SUPABASE_ANON_KEY could not be decoded as a JWT.')
        }
      }
    }
  }

  const html = readFileSync(join(DIST, 'index.html'), 'utf8')
  if (!html.includes(`assets/${bundleName}`)) {
    fail(`dist/index.html does not reference ${bundleName}.`)
  }
}

// The invoice Edge Function is deployed on its own, so it carries copies of the
// price list and the pricing code. An invoice must bill what the guest was
// shown on the site, and a gift card must say what its preview on the site
// said, so the copies may not drift from the originals.
for (const [original, copy] of [
  ['src/data/priceCatalog.json', 'supabase/functions/invoice/priceCatalog.json'],
  ['src/lib/pricing.ts', 'supabase/functions/invoice/pricing.ts'],
  ['src/lib/giftCardText.ts', 'supabase/functions/invoice/giftCardText.ts'],
]) {
  if (readFileSync(original, 'utf8') !== readFileSync(copy, 'utf8')) {
    fail(`${copy} differs from ${original}. Copy it over and redeploy the invoice function.`)
  }
}

// The invoice function draws its PDFs with fonts it fetches from the live site.
for (const font of ['SaimniekaInvoiceSans-Regular.ttf', 'SaimniekaInvoiceSans-Bold.ttf']) {
  try {
    readFileSync(join(DIST, 'fonts', 'invoice', font))
  } catch {
    fail(`dist/fonts/invoice/${font} is missing; invoices could not be drawn.`)
  }
}

// And its gift cards with fonts and photos from the live site too.
for (const file of [
  'fonts/giftcard/CormorantGaramond_500Medium_Italic.ttf',
  'fonts/giftcard/CormorantGaramond_600SemiBold.ttf',
  'fonts/giftcard/Montserrat_400Regular.ttf',
  'fonts/giftcard/Montserrat_600SemiBold.ttf',
  'giftcard/value_front.jpg',
  'giftcard/value_back.jpg',
  'giftcard/ritual_front.jpg',
  'giftcard/ritual_back.jpg',
  'giftcard/logo_on_light.png',
  'giftcard/logo_on_dark.png',
  'giftcard/a4_whisk.jpg',
  'giftcard/a4_pond.jpg',
  'giftcard/a4_rest.jpg',
]) {
  try {
    readFileSync(join(DIST, file))
  } catch {
    fail(`dist/${file} is missing; gift cards could not be drawn.`)
  }
}

// Likewise the company details printed on invoices and shown on the site.
{
  const seller = JSON.parse(readFileSync('supabase/functions/invoice/seller.json', 'utf8'))
  const lv = JSON.parse(readFileSync('src/i18n/locales/lv/common.json', 'utf8')).company
  const en = JSON.parse(readFileSync('src/i18n/locales/en/common.json', 'utf8')).company
  const pairs = [
    [seller.name, lv.legalName, 'name'],
    [seller.regNumber, lv.regNumber, 'registration number'],
    [seller.address.lv, lv.legalAddress, 'Latvian address'],
    [seller.address.en, en.legalAddress, 'English address'],
    [seller.bank, lv.bank, 'bank'],
    [seller.iban, lv.iban, 'account'],
  ]
  for (const [onInvoice, onSite, what] of pairs) {
    if (onInvoice !== onSite) {
      fail(
        `The company ${what} in supabase/functions/invoice/seller.json ` +
          `("${onInvoice}") differs from the site's ("${onSite}").`
      )
    }
  }
}

if (problems.length > 0) {
  console.error('\nBuild verification failed:\n')
  for (const p of problems) console.error(`  - ${p}`)
  console.error('')
  process.exit(1)
}

console.log(`Build verification passed (${bundleName}).`)
