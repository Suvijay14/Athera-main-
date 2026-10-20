import { subDays } from 'date-fns'

import type { DbClient } from './db-client'
import { toJsonValue } from './json'
import { mapSuggestionRow } from './mappers'
import { wrapSupabaseError } from './errors'
import type { Suggestion } from './schemas'
import { operationsSchema } from '@/lib/adaptation/types'
import type { SuggestionDraft } from '@/lib/adaptation/detector-types'
import { track } from '@/lib/events'

export async function listRecentSuggestionsForDetection(
  client: DbClient,
  workspaceId: string,
  now: Date
): Promise<Suggestion[]> {
  const dismissedSince = subDays(now, 30).toISOString()

  const [activeRes, dismissedRes] = await Promise.all([
    client
      .from('suggestions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .in('status', ['pending', 'shown', 'accepted']),
    client
      .from('suggestions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'dismissed')
      .gte('resolved_at', dismissedSince),
  ])

  if (activeRes.error) {
    throw wrapSupabaseError('Failed to list active suggestions', activeRes.error)
  }
  if (dismissedRes.error) {
    throw wrapSupabaseError('Failed to list dismissed suggestions', dismissedRes.error)
  }

  return [...(activeRes.data ?? []), ...(dismissedRes.data ?? [])].map(mapSuggestionRow)
}

export async function insertPendingSuggestion(
  client: DbClient,
  workspaceId: string,
  draft: SuggestionDraft
): Promise<Suggestion | null> {
  const operations = operationsSchema.parse(draft.operations)
  const { data, error } = await client
    .from('suggestions')
    .insert({
      workspace_id: workspaceId,
      type: draft.type,
      status: 'pending',
      reason: draft.reason,
      evidence: toJsonValue(draft.evidence),
      confidence: draft.confidence,
      operations: toJsonValue(operations),
      dedupe_key: draft.dedupeKey,
    })
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') {
      return null
    }
    throw wrapSupabaseError('Failed to insert suggestion', error)
  }
  return mapSuggestionRow(data)
}

export async function getSuggestion(
  client: DbClient,
  workspaceId: string,
  suggestionId: string
): Promise<Suggestion | null> {
  const { data, error } = await client
    .from('suggestions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('id', suggestionId)
    .maybeSingle()

  if (error) {
    throw wrapSupabaseError('Failed to load suggestion', error)
  }
  return data ? mapSuggestionRow(data) : null
}

export async function getPendingSuggestion(
  client: DbClient,
  workspaceId: string
): Promise<Suggestion | null> {
  const { data, error } = await client
    .from('suggestions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .in('status', ['pending', 'shown'])
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    throw wrapSupabaseError('Failed to load pending suggestion', error)
  }

  const rows = data ?? []
  if (rows.length > 1) {
    console.warn('Multiple active suggestions found; showing most recent', {
      workspaceId,
      count: rows.length,
    })
  }
  const first = rows[0]
  return first ? mapSuggestionRow(first) : null
}

export async function markSuggestionShown(
  client: DbClient,
  workspaceId: string,
  suggestionId: string,
  userId: string
): Promise<void> {
  const { data, error } = await client
    .from('suggestions')
    .select('id, status, type')
    .eq('id', suggestionId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (error) {
    throw wrapSupabaseError('Failed to load suggestion for shown', error)
  }
  if (!data) {
    return
  }
  if (data.status !== 'pending') {
    return
  }

  const { error: updateError } = await client
    .from('suggestions')
    .update({ status: 'shown' })
    .eq('id', suggestionId)
    .eq('workspace_id', workspaceId)
    .eq('status', 'pending')

  if (updateError) {
    throw wrapSupabaseError('Failed to mark suggestion shown', updateError)
  }

  try {
    await track(client, {
      workspaceId,
      userId,
      name: 'suggestion_shown',
      props: { suggestion_id: suggestionId, suggestion_type: data.type },
    })
  } catch (trackError) {
    console.error('suggestion_shown event failed', trackError)
  }
}
