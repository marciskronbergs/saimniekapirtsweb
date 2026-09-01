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
    bundleName = scripts[0]
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

if (problems.length > 0) {
  console.error('\nBuild verification failed:\n')
  for (const p of problems) console.error(`  - ${p}`)
  console.error('')
  process.exit(1)
}

console.log(`Build verification passed (${bundleName}).`)
