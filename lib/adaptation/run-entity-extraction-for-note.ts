import 'server-only'

import { listEntities } from '@/lib/db/entities'
import type { DbClient } from '@/lib/db/db-client'
import { extractEntitiesFromTitle } from '@/lib/llm/extract-entities'
import { LlmExtractionError } from '@/lib/llm/errors'

import { scheduleAdaptation } from './schedule-adaptation'

export async function runEntityExtractionForNote(
  client: DbClient,
  workspaceId: string,
  pageId: string,
  spaceId: string,
  bodyText: string
): Promise<void> {
  const trimmed = bodyText.trim()
  if (trimmed.length < 3) {
    return
  }

  const sample = trimmed.length > 2000 ? trimmed.slice(0, 2000) : trimmed
  const entities = await listEntities(client, workspaceId, spaceId)
  const existingForPrompt = entities.map((e) => ({
    id: e.id,
    name: e.name,
    kind: e.kind,
    aliases: e.aliases,
  }))

  let extracted
  try {
    extracted = await extractEntitiesFromTitle(sample, existingForPrompt)
  } catch (err) {
    if (err instanceof LlmExtractionError) {
      console.warn('note entity extraction skipped', { pageId, code: err.code })
      return
    }
    throw err
  }

  await client.from('page_entity_extractions').delete().eq('page_id', pageId)

  if (extracted.length === 0) {
    scheduleAdaptation(client, workspaceId)
    return
  }

  const rows = extracted.map((e) => ({
    workspace_id: workspaceId,
    page_id: pageId,
    space_id: spaceId,
    name: e.name,
    kind: e.kind,
    matches_existing_id: e.matches_existing_id,
    confidence: e.confidence,
  }))
  const { error } = await client.from('page_entity_extractions').insert(rows)
  if (error) {
    throw error
  }

  scheduleAdaptation(client, workspaceId)
}
