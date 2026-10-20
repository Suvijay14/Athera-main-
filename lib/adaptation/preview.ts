import 'server-only'

import { SuggestionStateError } from '@/lib/adaptation/errors'
import type { DbClient } from '@/lib/db/db-client'
import { getItemsByIds } from '@/lib/db/items'
import { getSuggestion } from '@/lib/db/suggestions'

import {
  assertPreviewableSuggestionStatus,
  buildSuggestionPreview,
  parseSuggestionOperations,
  type SuggestionPreview,
} from './preview-build'

export type { SuggestionPreview } from './preview-build'

export async function previewSuggestion(
  client: DbClient,
  workspaceId: string,
  suggestionId: string
): Promise<SuggestionPreview> {
  const suggestion = await getSuggestion(client, workspaceId, suggestionId)
  if (!suggestion) {
    throw new SuggestionStateError(`Suggestion "${suggestionId}" not found`)
  }
  assertPreviewableSuggestionStatus(suggestion.status)

  const operations = parseSuggestionOperations(suggestion.operations)
  const evidenceItemIds = Array.isArray(suggestion.evidence.itemIds)
    ? suggestion.evidence.itemIds.filter((id): id is string => typeof id === 'string')
    : []
  const backfillIds = operations.flatMap((op) =>
    op.op === 'backfill_field' ? Object.keys(op.values) : []
  )
  const ids = [...new Set([...evidenceItemIds, ...backfillIds])].slice(0, 20)
  const items = await getItemsByIds(client, workspaceId, ids)
  const titles = new Map(items.map((item) => [item.id, item.title]))

  return buildSuggestionPreview(operations, suggestion.evidence, titles)
}

export async function previewFromLoadedSuggestion(
  client: DbClient,
  workspaceId: string,
  suggestion: { operations: unknown; evidence: Record<string, unknown> }
): Promise<SuggestionPreview> {
  const operations = parseSuggestionOperations(suggestion.operations)
  const backfillIds = operations.flatMap((op) =>
    op.op === 'backfill_field' ? Object.keys(op.values) : []
  )
  const evidenceIds = Array.isArray(suggestion.evidence.itemIds)
    ? suggestion.evidence.itemIds.filter((id): id is string => typeof id === 'string')
    : []
  const ids = [...new Set([...evidenceIds, ...backfillIds])].slice(0, 20)
  const items = await getItemsByIds(client, workspaceId, ids)
  const titles = new Map(items.map((item) => [item.id, item.title]))
  return buildSuggestionPreview(operations, suggestion.evidence, titles)
}
