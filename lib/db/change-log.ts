import type { DbClient } from './db-client'
import { wrapSupabaseError } from './errors'
import { mapChangeLogRow } from './mappers'
import type { ChangeLogEntry } from './schemas'

export type ChangeLogListItem = ChangeLogEntry & {
  suggestionType: string
  suggestionReason: string
}

export async function getChangeLogEntry(
  client: DbClient,
  workspaceId: string,
  changeLogId: string
): Promise<ChangeLogEntry | null> {
  const { data, error } = await client
    .from('change_log')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('id', changeLogId)
    .maybeSingle()

  if (error) {
    throw wrapSupabaseError('Failed to load change log entry', error)
  }
  return data ? mapChangeLogRow(data) : null
}

export async function getLatestChangeLogForSuggestion(
  client: DbClient,
  workspaceId: string,
  suggestionId: string
): Promise<ChangeLogEntry | null> {
  const { data, error } = await client
    .from('change_log')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('suggestion_id', suggestionId)
    .order('applied_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw wrapSupabaseError('Failed to load change log for suggestion', error)
  }
  return data ? mapChangeLogRow(data) : null
}

export async function listDistinctWorkspaceIdsWithChanges(client: DbClient): Promise<string[]> {
  const { data, error } = await client.from('change_log').select('workspace_id')
  if (error) {
    throw wrapSupabaseError('Failed to list change log workspaces', error)
  }
  return [...new Set((data ?? []).map((r) => r.workspace_id as string))]
}

/** Active (non-undone) changes; age filtering happens in the retention job. */
export async function listActiveChangeLogEntries(
  client: DbClient,
  workspaceId: string
): Promise<ChangeLogEntry[]> {
  const { data, error } = await client
    .from('change_log')
    .select('*')
    .eq('workspace_id', workspaceId)
    .is('undone_at', null)
    .order('applied_at', { ascending: true })

  if (error) {
    throw wrapSupabaseError('Failed to list active change log entries', error)
  }
  return (data ?? []).map(mapChangeLogRow)
}

export async function countActiveAdaptations(
  client: DbClient,
  workspaceId: string
): Promise<number> {
  const { data, error } = await client
    .from('change_log')
    .select('suggestion_id')
    .eq('workspace_id', workspaceId)
    .is('undone_at', null)

  if (error) {
    throw wrapSupabaseError('Failed to count active adaptations', error)
  }
  return new Set((data ?? []).map((r) => r.suggestion_id as string)).size
}

export async function listChangeLog(
  client: DbClient,
  workspaceId: string,
  limit = 20
): Promise<ChangeLogListItem[]> {
  const { data, error } = await client
    .from('change_log')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('applied_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw wrapSupabaseError('Failed to list change log', error)
  }

  const entries = (data ?? []).map(mapChangeLogRow)
  if (entries.length === 0) {
    return []
  }

  const suggestionIds = [...new Set(entries.map((e) => e.suggestionId))]
  const { data: suggestions, error: sugError } = await client
    .from('suggestions')
    .select('id, type, reason')
    .eq('workspace_id', workspaceId)
    .in('id', suggestionIds)

  if (sugError) {
    throw wrapSupabaseError('Failed to load suggestions for change log', sugError)
  }

  const byId = new Map(
    (suggestions ?? []).map((s) => [s.id, { type: s.type, reason: s.reason }])
  )

  return entries.map((entry) => {
    const sug = byId.get(entry.suggestionId)
    return {
      ...entry,
      suggestionType: sug?.type ?? 'unknown',
      suggestionReason: sug?.reason ?? 'Workspace change',
    }
  })
}
