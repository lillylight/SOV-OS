import { createClient } from '@supabase/supabase-js'

const PROJECT_REF = 'hqexnppwltaodjmwaqsc'
const isServer = typeof window === 'undefined'

// Sanitize env values — Vercel dashboard sometimes stores \r\n in values
function clean(val: string | undefined): string {
  return val ? val.replace(/[\r\n\s]+/g, '') : ''
}

let supabaseUrl = clean(process.env.NEXT_PUBLIC_SUPABASE_URL) || `https://${PROJECT_REF}.supabase.co`

// HEAL: If there's a common typo in the URL from Vercel dash, fix it
if (supabaseUrl.includes('hqexnppwltadojmwaxsc')) {
  supabaseUrl = `https://${PROJECT_REF}.supabase.co`
}

const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxZXhucHB3bHRhb2RqbXdhcXNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MzkwMTYsImV4cCI6MjA4OTAxNTAxNn0.R-KgHeuQl-DCoLcX1-Rx5Pt80-VEWy1KNz5haLp7arg'

// Validate a Supabase JWT belongs to our project ref
function isKeyValid(key: string): boolean {
  try {
    const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64').toString())
    return payload.ref === PROJECT_REF
  } catch { return false }
}

// Resolve key: prefer service role (bypasses RLS), fall back to anon
function resolveKey(): string {
  if (isServer) {
    const serviceKey = clean(process.env.SUPABASE_SERVICE_ROLE_KEY)
    if (serviceKey && isKeyValid(serviceKey)) return serviceKey
    if (serviceKey && !isKeyValid(serviceKey)) {
      console.warn(`⚠️  SUPABASE_SERVICE_ROLE_KEY ref mismatch — expected "${PROJECT_REF}". Falling back to anon key.`)
    }
  }
  const envAnon = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  if (envAnon && isKeyValid(envAnon)) return envAnon
  return ANON_KEY
}

const supabaseKey = resolveKey()

if (isServer) {
  console.log('Supabase Server Init:', {
    url: supabaseUrl,
    keyRole: supabaseKey === ANON_KEY ? 'anon (hardcoded)' : supabaseKey.includes('service_role') ? 'service_role' : 'anon (env)',
    keyStart: supabaseKey.substring(0, 20) + '...',
  })
}

let supabaseInstance: any

try {
  supabaseInstance = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: typeof window !== 'undefined',
      persistSession: typeof window !== 'undefined'
    }
  })
} catch (e) {
  console.error('Supabase initialization failed:', e)
  // Provide a stub to prevent top-level crashes
  supabaseInstance = {
    from: () => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Supabase not initialized' } }) }) }),
      insert: () => Promise.resolve({ error: { message: 'Supabase not initialized' } }),
      upsert: () => Promise.resolve({ error: { message: 'Supabase not initialized' } }),
      delete: () => ({ eq: () => Promise.resolve({ error: { message: 'Supabase not initialized' } }) })
    }),
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      getSession: () => Promise.resolve({ data: { session: null } })
    }
  }
}

export const supabase = supabaseInstance
