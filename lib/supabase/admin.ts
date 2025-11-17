import { createClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase admin client with service role key
 * This bypasses Row Level Security (RLS) and should only be used in server-side code
 * Use this for background jobs that don't have access to user sessions
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }

  if (!supabaseServiceKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY environment variable. This is required for background jobs like scraping. Get it from Supabase Dashboard > Settings > API > service_role key'
    )
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

