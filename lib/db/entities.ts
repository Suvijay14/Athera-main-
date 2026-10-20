import type { Database } from './database.types'
import type { DbClient } from './db-client'
import { wrapSupabaseError } from './errors'
import { mapEntityRow } from './mappers'
import type { CreateEntityInput, Entity, UpdateEntityInput } from './schemas'
import { createEntityInputSchema, updateEntityInputSchema } from './schemas'

export async function getEntityById(
  client: DbClient,
  workspaceId: string,
  entityId: string
): Promise<Entity | null> {
  const { data, error } = await client
    .from('entities')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('id', entityId)
    .maybeSingle()

  if (error) {
    throw wrapSupabaseError('Failed to load entity', error)
  }
  return data ? mapEntityRow(data) : null
}

export async function listEntitiesForWorkspace(
  client: DbClient,
  workspaceId: string
): Promise<Entity[]> {
  const { data, error } = await client
    .from('entities')
    .select('*')
    .eq('workspace_id', workspaceId)
    .is('archived_at', null)

  if (error) {
    throw wrapSupabaseError('Failed to list entities', error)
  }
  return (data ?? []).map(mapEntityRow)
}

export async function listEntitiesInSpace(
  client: DbClient,
  workspaceId: string,
  spaceId: string,
  opts?: { includeArchived?: boolean }
): Promise<Entity[]> {
  let q = client
    .from('entities')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('space_id', spaceId)
  if (!opts?.includeArchived) {
    q = q.is('archived_at', null)
  }
  const { data, error } = await q.order('name', { ascending: true })

  if (error) {
    throw wrapSupabaseError('Failed to list entities', error)
  }
  return (data ?? []).map(mapEntityRow)
}

export async function listEntities(
  client: DbClient,
  workspaceId: string,
  spaceId: string
): Promise<Entity[]> {
  return listEntitiesInSpace(client, workspaceId, spaceId)
}

export async function updateEntityRhythm(
  client: DbClient,
  workspaceId: string,
  entityId: string,
  rhythm: { typicalGapDays: number | null; lastActivityAt: Date | null }
): Promise<void> {
  const { error } = await client
    .from('entities')
    .update({
      typical_gap_days: rhythm.typicalGapDays,
      last_activity_at: rhythm.lastActivityAt?.toISOString() ?? null,
    })
    .eq('workspace_id', workspaceId)
    .eq('id', entityId)

  if (error) {
    throw wrapSupabaseError('Failed to update entity rhythm', error)
  }
}

export async function setEntityExcludedFromSuggestions(
  client: DbClient,
  workspaceId: string,
  entityId: string,
  excluded: boolean
): Promise<Entity> {
  const { data, error } = await client
    .from('entities')
    .update({
      excluded_from_suggestions: excluded,
    } as Database['public']['Tables']['entities']['Update'])
    .eq('workspace_id', workspaceId)
    .eq('id', entityId)
    .select('*')
    .single()

  if (error) {
    throw wrapSupabaseError('Failed to update entity suggestion preference', error)
  }
  return mapEntityRow(data)
}

export async function createEntity(
  client: DbClient,
  workspaceId: string,
  input: CreateEntityInput
): Promise<Entity> {
  const parsed = createEntityInputSchema.parse(input)
  const { data, error } = await client
    .from('entities')
    .insert({
      workspace_id: workspaceId,
      space_id: parsed.spaceId,
      kind: parsed.kind,
      name: parsed.name,
      aliases: parsed.aliases,
      color: parsed.color ?? null,
      last_activity_at: parsed.lastActivityAt ?? null,
      typical_gap_days: parsed.typicalGapDays ?? null,
    })
    .select('*')
    .single()

  if (error) {
    throw wrapSupabaseError('Failed to create entity', error)
  }
  return mapEntityRow(data)
}

export async function archiveEntity(
  client: DbClient,
  workspaceId: string,
  entityId: string
): Promise<Entity> {
  const { data, error } = await client
    .from('entities')
    .update({ archived_at: new Date().toISOString() })
    .eq('workspace_id', workspaceId)
    .eq('id', entityId)
    .select('*')
    .single()

  if (error) {
    throw wrapSupabaseError('Failed to archive entity', error)
  }
  return mapEntityRow(data)
}

export async function unarchiveEntity(
  client: DbClient,
  workspaceId: string,
  entityId: string
): Promise<Entity> {
  const { data, error } = await client
    .from('entities')
    .update({ archived_at: null })
    .eq('workspace_id', workspaceId)
    .eq('id', entityId)
    .select('*')
    .single()

  if (error) {
    throw wrapSupabaseError('Failed to unarchive entity', error)
  }
  return mapEntityRow(data)
}

export async function updateEntity(
  client: DbClient,
  workspaceId: string,
  entityId: string,
  patch: UpdateEntityInput
): Promise<Entity> {
  const parsed = updateEntityInputSchema.parse(patch)
  const row: Database['public']['Tables']['entities']['Update'] = {}
  if (parsed.name !== undefined) row.name = parsed.name
  if (parsed.aliases !== undefined) row.aliases = parsed.aliases
  if (parsed.color !== undefined) row.color = parsed.color
  if (parsed.lastActivityAt !== undefined) row.last_activity_at = parsed.lastActivityAt
  if (parsed.typicalGapDays !== undefined) row.typical_gap_days = parsed.typicalGapDays
  if (parsed.kind !== undefined) row.kind = parsed.kind

  const { data, error } = await client
    .from('entities')
    .update(row)
    .eq('workspace_id', workspaceId)
    .eq('id', entityId)
    .select('*')
    .single()

  if (error) {
    throw wrapSupabaseError('Failed to update entity', error)
  }
  return mapEntityRow(data)
}
