import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/db/database.types'

export type TestEnv = {
  url: string
  anonKey: string
  serviceKey: string
}

export function getTestEnv(): TestEnv | null {
  const url =
    process.env.SUPABASE_TEST_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey =
    process.env.SUPABASE_TEST_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  const serviceKey =
    process.env.SUPABASE_TEST_SERVICE_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !anonKey || !serviceKey) {
    return null
  }
  return { url, anonKey, serviceKey }
}

export function adminClient(env: TestEnv): SupabaseClient<Database> {
  return createClient<Database>(env.url, env.serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function anonClient(env: TestEnv): SupabaseClient<Database> {
  return createClient<Database>(env.url, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function createTestUser(
  env: TestEnv,
  email: string,
  password: string
): Promise<{ id: string; client: SupabaseClient<Database> }> {
  const admin = adminClient(env)
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error || !data.user) {
    throw error ?? new Error('Failed to create test user')
  }

  const client = createClient<Database>(env.url, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { error: signInError } = await client.auth.signInWithPassword({ email, password })
  if (signInError) {
    throw signInError
  }

  return { id: data.user.id, client }
}

export async function createWorkspaceForOwner(
  client: SupabaseClient<Database>,
  ownerId: string
): Promise<string> {
  const { data, error } = await client
    .from('workspaces')
    .insert({ owner_id: ownerId })
    .select('id')
    .single()
  if (error) {
    throw error
  }
  const workspaceId = data.id
  const { error: spaceError } = await client.from('spaces').insert({
    workspace_id: workspaceId,
    name: 'My space',
    is_default: true,
    sort_order: 0,
  })
  if (spaceError) {
    throw spaceError
  }
  return workspaceId
}
