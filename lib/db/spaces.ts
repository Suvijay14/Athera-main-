import type { Database } from './database.types'
import type { DbClient } from './db-client'
import { DbError, wrapSupabaseError } from './errors'
import { mapSpaceRow } from './mappers'
import type { CreateSpaceInput, Space, UpdateSpaceInput } from './schemas'
import { createSpaceInputSchema, updateSpaceInputSchema } from './schemas'

export async function listSpaces(
  client: DbClient,
  workspaceId: string,
  opts?: { includeArchived?: boolean }
): Promise<Space[]> {
  let query = client.from('spaces').select('*').eq('workspace_id', workspaceId)
  if (!opts?.includeArchived) {
    query = query.is('archived_at', null)
  }
  const { data, error } = await query
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    throw wrapSupabaseError('Failed to list spaces', error)
  }
  return (data ?? []).map(mapSpaceRow)
}

export async function getSpaceById(
  client: DbClient,
  workspaceId: string,
  spaceId: string
): Promise<Space | null> {
  const { data, error } = await client
    .from('spaces')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('id', spaceId)
    .maybeSingle()

  if (error) {
    throw wrapSupabaseError('Failed to load space', error)
  }
  return data ? mapSpaceRow(data) : null
}

export async function getDefaultSpaceId(client: DbClient, workspaceId: string): Promise<string> {
  const { data, error } = await client
    .from('spaces')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('is_default', true)
    .maybeSingle()

  if (error) {
    throw wrapSupabaseError('Failed to load default space', error)
  }
  if (!data?.id) {
    throw new DbError('not_found', 'Default space missing for workspace')
  }
  return data.id
}

export async function createDefaultSpaceForWorkspace(
  client: DbClient,
  workspaceId: string
): Promise<Space> {
  const existing = await client
    .from('spaces')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('is_default', true)
    .maybeSingle()

  if (existing.error) {
    throw wrapSupabaseError('Failed to check default space', existing.error)
  }
  if (existing.data) {
    return mapSpaceRow(existing.data)
  }

  const { data, error } = await client
    .from('spaces')
    .insert({
      workspace_id: workspaceId,
      name: 'My space',
      is_default: true,
      sort_order: 0,
    })
    .select('*')
    .single()

  if (error) {
    throw wrapSupabaseError('Failed to create default space', error)
  }
  return mapSpaceRow(data)
}

export async function createSpace(
  client: DbClient,
  workspaceId: string,
  input: CreateSpaceInput
): Promise<Space> {
  const parsed = createSpaceInputSchema.parse(input)
  const { data, error } = await client
    .from('spaces')
    .insert({
      workspace_id: workspaceId,
      name: parsed.name,
      icon: parsed.icon ?? null,
      color: parsed.color ?? null,
      sort_order: parsed.sortOrder,
      is_default: false,
    })
    .select('*')
    .single()

  if (error) {
    throw wrapSupabaseError('Failed to create space', error)
  }
  return mapSpaceRow(data)
}

export async function renameSpace(
  client: DbClient,
  workspaceId: string,
  spaceId: string,
  name: string
): Promise<Space> {
  const trimmed = name.trim()
  if (!trimmed) {
    throw new DbError('validation', 'Space name is required')
  }
  const { data, error } = await client
    .from('spaces')
    .update({ name: trimmed })
    .eq('workspace_id', workspaceId)
    .eq('id', spaceId)
    .select('*')
    .single()

  if (error) {
    throw wrapSupabaseError('Failed to rename space', error)
  }
  return mapSpaceRow(data)
}

export async function archiveSpace(
  client: DbClient,
  workspaceId: string,
  spaceId: string
): Promise<Space> {
  const { data: space, error: loadError } = await client
    .from('spaces')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('id', spaceId)
    .single()

  if (loadError) {
    throw wrapSupabaseError('Failed to load space', loadError)
  }
  if (space.is_default) {
    throw new DbError('validation', 'Cannot archive the default space')
  }

  const { data, error } = await client
    .from('spaces')
    .update({ archived_at: new Date().toISOString() })
    .eq('workspace_id', workspaceId)
    .eq('id', spaceId)
    .select('*')
    .single()

  if (error) {
    throw wrapSupabaseError('Failed to archive space', error)
  }
  return mapSpaceRow(data)
}

export async function reorderSpaces(
  client: DbClient,
  workspaceId: string,
  orderedSpaceIds: string[]
): Promise<void> {
  const updates = orderedSpaceIds.map((id, sortOrder) =>
    client
      .from('spaces')
      .update({ sort_order: sortOrder })
      .eq('workspace_id', workspaceId)
      .eq('id', id)
  )
  const results = await Promise.all(updates)
  const failed = results.find((r) => r.error)
  if (failed?.error) {
    throw wrapSupabaseError('Failed to reorder spaces', failed.error)
  }
}

export async function unarchiveSpace(
  client: DbClient,
  workspaceId: string,
  spaceId: string
): Promise<Space> {
  const { data, error } = await client
    .from('spaces')
    .update({ archived_at: null })
    .eq('workspace_id', workspaceId)
    .eq('id', spaceId)
    .select('*')
    .single()

  if (error) {
    throw wrapSupabaseError('Failed to restore space', error)
  }
  return mapSpaceRow(data)
}

export async function updateSpace(
  client: DbClient,
  workspaceId: string,
  spaceId: string,
  patch: UpdateSpaceInput
): Promise<Space> {
  const parsed = updateSpaceInputSchema.parse(patch)
  const row: Database['public']['Tables']['spaces']['Update'] = {}
  if (parsed.name !== undefined) row.name = parsed.name
  if (parsed.icon !== undefined) row.icon = parsed.icon
  if (parsed.color !== undefined) row.color = parsed.color
  if (parsed.sortOrder !== undefined) row.sort_order = parsed.sortOrder

  const { data, error } = await client
    .from('spaces')
    .update(row)
    .eq('workspace_id', workspaceId)
    .eq('id', spaceId)
    .select('*')
    .single()

  if (error) {
    throw wrapSupabaseError('Failed to update space', error)
  }
  return mapSpaceRow(data)
}
