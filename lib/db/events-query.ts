import { subDays } from 'date-fns'

import type { DbClient } from './db-client'
import { wrapSupabaseError } from './errors'
import { mapAppEventRow } from './mappers'
import type { AppEvent } from './schemas'

export async function listWorkspaceEvents(
  client: DbClient,
  workspaceId: string,
  options: { names?: AppEvent['name'][]; since?: Date } = {}
): Promise<AppEvent[]> {
  let query = client.from('events').select('*').eq('workspace_id', workspaceId)
  if (options.names && options.names.length > 0) {
    query = query.in('name', options.names)
  }
  if (options.since) {
    query = query.gte('created_at', options.since.toISOString())
  }
  const { data, error } = await query.order('created_at', { ascending: false }).limit(5000)
  if (error) {
    throw wrapSupabaseError('Failed to list events', error)
  }
  return (data ?? []).map(mapAppEventRow)
}

export async function listRecentViewOpenedEvents(
  client: DbClient,
  workspaceId: string,
  now: Date
): Promise<AppEvent[]> {
  return listWorkspaceEvents(client, workspaceId, {
    names: ['view_opened'],
    since: subDays(now, 14),
  })
}
