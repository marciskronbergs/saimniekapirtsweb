// Fails the build when dist/ was produced without the Supabase configuration.
//
// Vite inlines import.meta.env.VITE_* at build time, so a build started without
// those variables silently produces a bundle whose Supabase client is dead. The
// resulting site looks fine to the build system -- it compiles, it uploads, it
// deploys -- and only breaks in the visitor's browser. This check catches that
// before the deploy is published.
//
// Run it after `npm run build`:  node scripts/verify-build.mjs

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const DIST = 'dist'
const ASSETS = join(DIST, 'assets')

const problems = []

function fail(message) {
  problems.push(message)
}

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

if (bundle) {
  // The placeholders in src/lib/supabase.ts only survive minification when the
  // real values were absent, so their presence is a direct signal.
  if (bundle.includes('unconfigured.invalid')) {
    fail(
      'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY were not set when this ' +
        'build ran, so reservations will not work. Set them in the Netlify ' +
        'project (Project configuration -> Environment variables, scope ' +
        '"Builds") or in a local .env file, then rebuild.'
    )
  } else if (!/https:\/\/[a-z0-9]+\.supabase\.co/.test(bundle)) {
    fail(
      `No Supabase URL is present in ${bundleName}. The client cannot reach ` +
        'the database, so reservations will not work.'
    )
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
