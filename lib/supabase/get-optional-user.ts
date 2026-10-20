import 'server-only'

import type { User } from '@supabase/supabase-js'

import { createClient } from './server'

export async function getOptionalUser(): Promise<User | null> {
  const client = await createClient()
  const {
    data: { user },
    error,
  } = await client.auth.getUser()
  if (error) {
    return null
  }
  return user
}
