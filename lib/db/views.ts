import type { DbClient } from './db-client'
import { toJson } from './json'
import { wrapSupabaseError } from './errors'
import { mapViewDefinitionRow } from './mappers'
import type { CreateViewInput, ViewDefinition } from './schemas'
import { createViewInputSchema } from './schemas'

export async function listViews(client: DbClient, workspaceId: string): Promise<ViewDefinition[]> {
  const { data, error } = await client
    .from('view_definitions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    throw wrapSupabaseError('Failed to list views', error)
  }
  return (data ?? []).map(mapViewDefinitionRow)
}

export async function createView(
  client: DbClient,
  workspaceId: string,
  input: CreateViewInput
): Promise<ViewDefinition> {
  const parsed = createViewInputSchema.parse(input)
  const { data, error } = await client
    .from('view_definitions')
    .insert({
      workspace_id: workspaceId,
      name: parsed.name,
      type: parsed.type,
      group_by_field:
        parsed.type === 'list' || parsed.type === 'calendar'
          ? null
          : parsed.groupByField ?? null,
      color_by_field: parsed.colorByField ?? null,
      calendar_range: parsed.calendarRange ?? null,
      filters: toJson(parsed.filters),
      visible: parsed.visible,
      position: parsed.position,
      source: parsed.source,
    })
    .select('*')
    .single()

  if (error) {
    throw wrapSupabaseError('Failed to create view', error)
  }
  return mapViewDefinitionRow(data)
}

export async function updateView(
  client: DbClient,
  workspaceId: string,
  id: string,
  patch: {
    calendarRange?: 'week' | 'month' | null
    colorByField?: string | null
  }
): Promise<ViewDefinition> {
  const updates: {
    calendar_range?: 'week' | 'month' | null
    color_by_field?: string | null
  } = {}
  if (patch.calendarRange !== undefined) {
    updates.calendar_range = patch.calendarRange
  }
  if (patch.colorByField !== undefined) {
    updates.color_by_field = patch.colorByField
  }
  const { data, error } = await client
    .from('view_definitions')
    .update(updates)
    .eq('workspace_id', workspaceId)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    throw wrapSupabaseError('Failed to update view', error)
  }
  return mapViewDefinitionRow(data)
}

export async function setViewVisibility(
  client: DbClient,
  workspaceId: string,
  id: string,
  visible: boolean
): Promise<ViewDefinition> {
  const { data, error } = await client
    .from('view_definitions')
    .update({ visible })
    .eq('workspace_id', workspaceId)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    throw wrapSupabaseError('Failed to update view visibility', error)
  }
  return mapViewDefinitionRow(data)
}
