import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // PKCE flow: redirects arrive as ?code=xxx in the query string rather than
    // #access_token=xxx in the URL fragment.  HashRouter only looks at the hash,
    // so query-string params are never touched by the router — the code survives
    // long enough for Supabase to exchange it for a session.
    flowType: 'pkce',
  },
})
