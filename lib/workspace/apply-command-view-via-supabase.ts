import 'server-only'

import type { Operation } from '@/lib/adaptation/types'
import type { DbClient } from '@/lib/db/db-client'
import { toJsonValue } from '@/lib/db/json'
import { wrapSupabaseError } from '@/lib/db/errors'
import { createView } from '@/lib/db/views'

export function isPgConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }
  const message = error.message.toLowerCase()
  return (
    message.includes('connect') ||
    message.includes('timeout') ||
    message.includes('database url') ||
    message.includes('econnrefused') ||
    message.includes('connection terminated')
  )
}

/**
 * Applies a single create_view command-bar suggestion when direct Postgres (pg) is unavailable.
 * Writes change_log so undo still has inverse metadata; undo execution still prefers pg when configured.
 */
export async function applyCreateViewSuggestionViaSupabase(
  client: DbClient,
  workspaceId: string,
  suggestionId: string,
  operation: Operation & { op: 'create_view' }
): Promise<string> {
  const v = operation.view
  const created = await createView(client, workspaceId, {
    name: v.name,
    type: v.type,
    groupByField: v.groupByField ?? null,
    colorByField: v.colorByField ?? null,
    calendarRange: v.calendarRange ?? null,
    filters: v.filters ?? {},
    visible: true,
    position: 0,
    source: 'athera',
  })

  const operations: Operation[] = [operation]
  const inverseOperations: Operation[] = [{ op: 'delete_view', viewId: created.id }]

  const { error: logError } = await client.from('change_log').insert({
    workspace_id: workspaceId,
    suggestion_id: suggestionId,
    operations: toJsonValue(operations),
    inverse_operations: toJsonValue(inverseOperations),
  })
  if (logError) {
    throw wrapSupabaseError('Failed to write change log', logError)
  }

  const { error: sugError } = await client
    .from('suggestions')
    .update({ status: 'accepted', resolved_at: new Date().toISOString() })
    .eq('workspace_id', workspaceId)
    .eq('id', suggestionId)
    .eq('status', 'pending')

  if (sugError) {
    throw wrapSupabaseError('Failed to mark suggestion accepted', sugError)
  }

  return created.id
}
