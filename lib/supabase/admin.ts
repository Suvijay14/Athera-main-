import 'server-only'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

import { getSupabaseServiceRoleKey, getSupabaseUrl, isSupabaseServiceRoleConfigured } from './env'

export function createAdminClient() {
  if (!isSupabaseServiceRoleConfigured()) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
  }
  return createSupabaseClient(getSupabaseUrl(), getSupabaseServiceRoleKey()!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
