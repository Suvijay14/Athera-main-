import type { Database } from './database.types'
import type { DbClient } from './db-client'
import { DbError, wrapSupabaseError } from './errors'
import { listFields } from './fields'
import { mapWorkItemRow } from './mappers'
import { getDefaultSpaceId } from './spaces'
import type { CreateWorkItemInput, UpdateWorkItemInput, WorkItem } from './schemas'
import { createWorkItemInputSchema, updateWorkItemInputSchema } from './schemas'
import { toJson } from './json'
import { validateItemData } from './validate-item-data'

const DEFAULT_LIMIT = 100
const MAX_LIMIT = 500

export type ListItemsCursor = {
  createdAt: string
  id: string
}

export type ListItemsOptions = {
  limit?: number
  cursor?: ListItemsCursor | null
  spaceId?: string
  /** When set, includes items in any of these spaces (mutually exclusive with spaceId). */
  spaceIds?: string[]
}

export type ListItemsResult = {
  items: WorkItem[]
  nextCursor: ListItemsCursor | null
}

function clampLimit(limit: number | undefined): number {
  if (limit === undefined) {
    return DEFAULT_LIMIT
  }
  return Math.min(Math.max(1, limit), MAX_LIMIT)
}

export async function listItems(
  client: DbClient,
  workspaceId: string,
  options: ListItemsOptions = {}
): Promise<ListItemsResult> {
  const limit = clampLimit(options.limit)
  let query = client
    .from('work_items')
    .select('*')
    .eq('workspace_id', workspaceId)

  if (options.spaceIds && options.spaceIds.length > 0) {
    query = query.in('space_id', options.spaceIds)
  } else if (options.spaceId) {
    query = query.eq('space_id', options.spaceId)
  }

  query = query
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1)

  if (options.cursor) {
    const { createdAt, id } = options.cursor
    query = query.or(
      `created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.lt.${id})`
    )
  }

  const { data, error } = await query
  if (error) {
    throw wrapSupabaseError('Failed to list work items', error)
  }

  const rows = data ?? []
  const hasMore = rows.length > limit
  const page = hasMore ? rows.slice(0, limit) : rows
  const last = page[page.length - 1]
  const nextCursor =
    hasMore && last
      ? { createdAt: last.created_at, id: last.id }
      : null

  return {
    items: page.map(mapWorkItemRow),
    nextCursor,
  }
}

async function validatedDataForWrite(
  client: DbClient,
  workspaceId: string,
  data: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const fields = await listFields(client, workspaceId)
  const result = validateItemData(data, fields)
  if (!result.ok) {
    throw new DbError('validation', result.errors.map((e) => e.message).join('; '))
  }
  return result.data
}

export async function createItem(
  client: DbClient,
  workspaceId: string,
  input: CreateWorkItemInput
): Promise<WorkItem> {
  const parsed = createWorkItemInputSchema.parse(input)
  const data = await validatedDataForWrite(client, workspaceId, parsed.data)
  const spaceId = parsed.spaceId ?? (await getDefaultSpaceId(client, workspaceId))

  const { data: row, error } = await client
    .from('work_items')
    .insert({
      workspace_id: workspaceId,
      space_id: spaceId,
      title: parsed.title,
      due_date: parsed.dueDate ?? null,
      notes: parsed.notes ?? null,
      data: toJson(data),
      start_at: parsed.startAt ?? null,
      end_at: parsed.endAt ?? null,
      all_day: parsed.allDay ?? false,
      source: parsed.source ?? 'manual',
      space_confidence: parsed.spaceConfidence ?? null,
      element_kind: parsed.elementKind ?? 'task',
    })
    .select('*')
    .single()

  if (error) {
    throw wrapSupabaseError('Failed to create work item', error)
  }
  return mapWorkItemRow(row)
}

export async function updateItem(
  client: DbClient,
  workspaceId: string,
  id: string,
  patch: UpdateWorkItemInput
): Promise<WorkItem> {
  const parsed = updateWorkItemInputSchema.parse(patch)
  const row: Record<string, unknown> = {}
  if (parsed.title !== undefined) row.title = parsed.title
  if (parsed.spaceId !== undefined) row.space_id = parsed.spaceId
  if (parsed.dueDate !== undefined) row.due_date = parsed.dueDate
  if (parsed.notes !== undefined) row.notes = parsed.notes
  if (parsed.startAt !== undefined) row.start_at = parsed.startAt
  if (parsed.endAt !== undefined) row.end_at = parsed.endAt
  if (parsed.allDay !== undefined) row.all_day = parsed.allDay
  if (parsed.source !== undefined) row.source = parsed.source
  if (parsed.spaceConfidence !== undefined) row.space_confidence = parsed.spaceConfidence
  if (parsed.completedAt !== undefined) row.completed_at = parsed.completedAt

  if (parsed.data !== undefined) {
    const { data: existing, error: loadError } = await client
      .from('work_items')
      .select('data')
      .eq('workspace_id', workspaceId)
      .eq('id', id)
      .single()

    if (loadError) {
      throw wrapSupabaseError('Failed to load work item for update', loadError)
    }

    const merged = {
      ...(typeof existing.data === 'object' && existing.data !== null && !Array.isArray(existing.data)
        ? (existing.data as Record<string, unknown>)
        : {}),
      ...parsed.data,
    }
    row.data = toJson(await validatedDataForWrite(client, workspaceId, merged))
  }

  if (Object.keys(row).length === 0) {
    const { data, error } = await client
      .from('work_items')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('id', id)
      .single()
    if (error) {
      throw wrapSupabaseError('Failed to load work item', error)
    }
    return mapWorkItemRow(data)
  }

  const { data, error } = await client
    .from('work_items')
    .update(row as Database['public']['Tables']['work_items']['Update'])
    .eq('workspace_id', workspaceId)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    throw wrapSupabaseError('Failed to update work item', error)
  }
  return mapWorkItemRow(data)
}

export async function getItemsByIds(
  client: DbClient,
  workspaceId: string,
  ids: string[]
): Promise<WorkItem[]> {
  if (ids.length === 0) {
    return []
  }
  const { data, error } = await client
    .from('work_items')
    .select('*')
    .eq('workspace_id', workspaceId)
    .in('id', ids)

  if (error) {
    throw wrapSupabaseError('Failed to load work items by id', error)
  }
  return (data ?? []).map(mapWorkItemRow)
}

export async function countItemsBySpace(
  client: DbClient,
  workspaceId: string
): Promise<Record<string, number>> {
  const { data, error } = await client
    .from('work_items')
    .select('space_id')
    .eq('workspace_id', workspaceId)

  if (error) {
    throw wrapSupabaseError('Failed to count items by space', error)
  }
  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    const sid = row.space_id as string
    counts[sid] = (counts[sid] ?? 0) + 1
  }
  return counts
}

export async function getItemById(
  client: DbClient,
  workspaceId: string,
  id: string
): Promise<WorkItem | null> {
  const { data, error } = await client
    .from('work_items')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw wrapSupabaseError('Failed to load work item', error)
  }
  return data ? mapWorkItemRow(data) : null
}

export async function deleteItem(client: DbClient, workspaceId: string, id: string): Promise<void> {
  const { error } = await client.from('work_items').delete().eq('workspace_id', workspaceId).eq('id', id)
  if (error) {
    throw wrapSupabaseError('Failed to delete work item', error)
  }
}

export type CalendarImportRow = {
  externalProvider: string
  externalId: string
  title: string
  notes: string | null
  startAt: string | null
  endAt: string | null
  dueDate: string | null
  allDay: boolean
  source: 'import'
}

export async function listExistingImportExternalIds(
  client: DbClient,
  workspaceId: string,
  spaceId: string
): Promise<Array<{ externalId: string; itemId: string }>> {
  const { data, error } = await client
    .from('work_items')
    .select('id, external_id')
    .eq('workspace_id', workspaceId)
    .eq('space_id', spaceId)
    .not('external_id', 'is', null)

  if (error) {
    throw wrapSupabaseError('Failed to list imported item external ids', error)
  }

  return (data ?? [])
    .filter((row) => typeof row.external_id === 'string' && row.external_id.length > 0)
    .map((row) => ({
      externalId: row.external_id as string,
      itemId: row.id as string,
    }))
}

export async function applyCalendarImportBatch(
  client: DbClient,
  workspaceId: string,
  spaceId: string,
  creates: CalendarImportRow[],
  updates: Array<{ itemId: string; patch: CalendarImportRow }>
): Promise<{ createdCount: number; updatedCount: number }> {
  let createdCount = 0
  let updatedCount = 0

  for (const row of creates) {
    const { error } = await client.from('work_items').insert({
      workspace_id: workspaceId,
      space_id: spaceId,
      title: row.title,
      notes: row.notes,
      data: toJson({}),
      start_at: row.startAt,
      end_at: row.endAt,
      due_date: row.dueDate,
      all_day: row.allDay,
      source: row.source,
      external_provider: row.externalProvider,
      external_id: row.externalId,
    })
    if (error) {
      throw wrapSupabaseError('Failed to insert imported calendar item', error)
    }
    createdCount += 1
  }

  for (const { itemId, patch } of updates) {
    const { error } = await client
      .from('work_items')
      .update({
        title: patch.title,
        notes: patch.notes,
        start_at: patch.startAt,
        end_at: patch.endAt,
        due_date: patch.dueDate,
        all_day: patch.allDay,
        source: patch.source,
        external_provider: patch.externalProvider,
        external_id: patch.externalId,
        updated_at: new Date().toISOString(),
      })
      .eq('workspace_id', workspaceId)
      .eq('id', itemId)

    if (error) {
      throw wrapSupabaseError('Failed to update imported calendar item', error)
    }
    updatedCount += 1
  }

  return { createdCount, updatedCount }
}
