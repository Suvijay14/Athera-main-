/**
 * Node-safe data access for item entity extractions (used by engine + scripts).
 * App-only entry: {@link ./item-entity-extractions.server}.
 */
import type { DbClient } from './db-client'
import { wrapSupabaseError } from './errors'
import type { ExtractedEntity } from '@/lib/llm/extract-entities'

export type StoredItemExtraction = {
  id: string
  workspaceId: string
  workItemId: string
  spaceId: string
  name: string
  kind: string
  matchesExistingId: string | null
  confidence: number
  createdAt: string
}

function mapRow(row: {
  id: string
  workspace_id: string
  work_item_id: string
  space_id: string
  name: string
  kind: string
  matches_existing_id: string | null
  confidence: number
  created_at: string
}): StoredItemExtraction {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    workItemId: row.work_item_id,
    spaceId: row.space_id,
    name: row.name,
    kind: row.kind,
    matchesExistingId: row.matches_existing_id,
    confidence: Number(row.confidence),
    createdAt: row.created_at,
  }
}

export async function replaceExtractionsForItem(
  client: DbClient,
  workspaceId: string,
  workItemId: string,
  spaceId: string,
  entities: ExtractedEntity[]
): Promise<void> {
  const { error: delError } = await client
    .from('item_entity_extractions')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('work_item_id', workItemId)

  if (delError) {
    throw wrapSupabaseError('Failed to clear item extractions', delError)
  }

  if (entities.length === 0) {
    return
  }

  const { error: insError } = await client.from('item_entity_extractions').insert(
    entities.map((e) => ({
      workspace_id: workspaceId,
      work_item_id: workItemId,
      space_id: spaceId,
      name: e.name.trim(),
      kind: e.kind.trim(),
      matches_existing_id: e.matches_existing_id,
      confidence: e.confidence,
    }))
  )

  if (insError) {
    throw wrapSupabaseError('Failed to store item extractions', insError)
  }
}

export async function listExtractionsForWorkspaceSince(
  client: DbClient,
  workspaceId: string,
  sinceIso: string
): Promise<StoredItemExtraction[]> {
  const { data, error } = await client
    .from('item_entity_extractions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: false })

  if (error) {
    throw wrapSupabaseError('Failed to list item extractions', error)
  }
  return (data ?? []).map(mapRow)
}
