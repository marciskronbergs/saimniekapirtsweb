import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY were missing when this build ' +
      'was made. Reservations will fail until they are set; the rest of the ' +
      'site still works.'
  )
}

// createClient throws "supabaseUrl is required." when either value is missing.
// That happens while this module loads, so it aborts the app before React
// mounts and leaves visitors with a blank page. Falling back keeps the site
// readable and reachable by phone; the queries then return an error object,
// which every call site already handles.
export const supabase = createClient(
  supabaseUrl || 'https://unconfigured.invalid',
  supabaseAnonKey || 'unconfigured'
)
