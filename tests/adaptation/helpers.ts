import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/db/database.types'
import { toJsonValue } from '@/lib/db/json'
import { getTestEnv } from '@/tests/rls/helpers'

export type AdaptationTestEnv = {
  url: string
  anonKey: string
  serviceKey: string
  dbUrl: string
}

export function getAdaptationTestEnv(): AdaptationTestEnv | null {
  const base = getTestEnv()
  const dbUrl =
    process.env.SUPABASE_TEST_DB_URL?.trim() ||
    process.env.SUPABASE_DB_URL?.trim() ||
    process.env.DATABASE_URL?.trim()
  if (!base || !dbUrl) {
    return null
  }
  return { ...base, dbUrl }
}

export function ensurePgEnv(dbUrl: string): void {
  process.env.SUPABASE_TEST_DB_URL = dbUrl
}

export async function defaultSpaceIdForWorkspace(
  client: SupabaseClient<Database>,
  workspaceId: string
): Promise<string> {
  const { data, error } = await client
    .from('spaces')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('is_default', true)
    .maybeSingle()
  if (error) {
    throw error
  }
  if (data?.id) {
    return data.id
  }
  const { data: created, error: insertError } = await client
    .from('spaces')
    .insert({ workspace_id: workspaceId, name: 'My space', is_default: true, sort_order: 0 })
    .select('id')
    .single()
  if (insertError) {
    throw insertError
  }
  return created.id
}

export async function createWorkItems(
  client: SupabaseClient<Database>,
  workspaceId: string,
  titles: string[]
): Promise<string[]> {
  const spaceId = await defaultSpaceIdForWorkspace(client, workspaceId)
  const ids: string[] = []
  for (const title of titles) {
    const { data, error } = await client
      .from('work_items')
      .insert({ workspace_id: workspaceId, space_id: spaceId, title })
      .select('id')
      .single()
    if (error) {
      throw error
    }
    ids.push(data.id)
  }
  return ids
}

export async function insertSuggestion(
  client: SupabaseClient<Database>,
  workspaceId: string,
  operations: unknown,
  dedupeKey: string
): Promise<string> {
  const { data, error } = await client
    .from('suggestions')
    .insert({
      workspace_id: workspaceId,
      type: 'test',
      reason: 'Because 3 similar items exist (test).',
      confidence: 0.9,
      operations: toJsonValue(operations),
      dedupe_key: dedupeKey,
    })
    .select('id')
    .single()
  if (error) {
    throw error
  }
  return data.id
}

export function keyAbsentInData(data: Record<string, unknown>, key: string): boolean {
  return !Object.prototype.hasOwnProperty.call(data, key)
}

export async function createEntityFieldForTests(
  client: SupabaseClient<Database>,
  workspaceId: string,
  key: string
): Promise<void> {
  const { applyOperations } = await import('@/lib/adaptation/apply')
  await applyOperations(client, workspaceId, [
    {
      op: 'create_field',
      field: { key, label: 'Client', type: 'entity', entityKind: 'client' },
    },
  ])
}

export async function insertEntityForTests(
  client: SupabaseClient<Database>,
  workspaceId: string,
  spaceId: string,
  name: string
): Promise<string> {
  const { data, error } = await client
    .from('entities')
    .insert({
      workspace_id: workspaceId,
      space_id: spaceId,
      kind: 'client',
      name,
      aliases: [],
      color: '#6366f1',
    })
    .select('id')
    .single()
  if (error) {
    throw error
  }
  return data.id
}

export async function insertLinkedWorkItem(
  client: SupabaseClient<Database>,
  workspaceId: string,
  spaceId: string,
  entityFieldKey: string,
  entityId: string,
  opts: { title: string; dueDate?: string | null }
): Promise<string> {
  const { data, error } = await client
    .from('work_items')
    .insert({
      workspace_id: workspaceId,
      space_id: spaceId,
      title: opts.title,
      due_date: opts.dueDate ?? null,
      data: { [entityFieldKey]: entityId },
    })
    .select('id')
    .single()
  if (error) {
    throw error
  }
  return data.id
}
