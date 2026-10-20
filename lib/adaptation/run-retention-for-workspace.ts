import { parseISO, subDays } from 'date-fns'

import { hasRetentionDecisionLogged } from '@/lib/adaptation/retention-cron'
import { determineRetention, RETENTION_EVALUATION_DAYS } from '@/lib/adaptation/retention'
import type { DbClient } from '@/lib/db/db-client'
import { listActiveChangeLogEntries } from '@/lib/db/change-log'
import { listRecentViewOpenedEvents } from '@/lib/db/events-query'
import { listFields } from '@/lib/db/fields'
import { listItems } from '@/lib/db/items'
import { listRecurrenceRules } from '@/lib/db/recurrence-rules'
import { listWorkspaceEvents } from '@/lib/db/events-query'
import { listViews } from '@/lib/db/views'
import { track } from '@/lib/events'

export type WorkspaceRetentionResult = {
  workspaceId: string
  evaluated: number
  retained: number
  abandoned: number
  skippedNotYet: number
  skippedAlreadyLogged: number
  errors: string[]
}

async function workspaceOwnerId(client: DbClient, workspaceId: string): Promise<string> {
  const { data, error } = await client
    .from('workspaces')
    .select('owner_id')
    .eq('id', workspaceId)
    .single()
  if (error || !data?.owner_id) {
    throw new Error(`Workspace owner not found for ${workspaceId}`)
  }
  return data.owner_id as string
}

export async function runRetentionForWorkspace(
  client: DbClient,
  workspaceId: string,
  now: Date
): Promise<WorkspaceRetentionResult> {
  const result: WorkspaceRetentionResult = {
    workspaceId,
    evaluated: 0,
    retained: 0,
    abandoned: 0,
    skippedNotYet: 0,
    skippedAlreadyLogged: 0,
    errors: [],
  }

  const cutoff = subDays(now, RETENTION_EVALUATION_DAYS)

  try {
    const ownerId = await workspaceOwnerId(client, workspaceId)
    const [
      entries,
      retentionEvents,
      viewEvents,
      fields,
      itemsResult,
      views,
      recurrenceRules,
    ] = await Promise.all([
      listActiveChangeLogEntries(client, workspaceId),
      listWorkspaceEvents(client, workspaceId, {
        names: ['adaptation_retained', 'adaptation_abandoned'],
      }),
      listRecentViewOpenedEvents(client, workspaceId, now),
      listFields(client, workspaceId),
      listItems(client, workspaceId, { limit: 500 }),
      listViews(client, workspaceId),
      listRecurrenceRules(client, workspaceId),
    ])

    const suggestionTypes = new Map<string, string>()
    const { data: suggestions } = await client
      .from('suggestions')
      .select('id, type')
      .eq('workspace_id', workspaceId)
    for (const s of suggestions ?? []) {
      suggestionTypes.set(s.id, s.type)
    }

    const loggedSuggestionIds = new Set(
      retentionEvents
        .map((e) => e.props.suggestion_id)
        .filter((id): id is string => typeof id === 'string')
    )

    for (const entry of entries) {
      if (
        loggedSuggestionIds.has(entry.suggestionId) ||
        hasRetentionDecisionLogged(retentionEvents, entry.suggestionId)
      ) {
        result.skippedAlreadyLogged += 1
        continue
      }

      if (parseISO(entry.appliedAt) > cutoff) {
        result.skippedNotYet += 1
        continue
      }

      try {
        const outcome = determineRetention({
          changeLogEntry: entry,
          suggestionType: suggestionTypes.get(entry.suggestionId) ?? 'unknown',
          recentEvents: viewEvents,
          items: itemsResult.items,
          fields,
          views,
          recurrenceRules,
          now,
        })

        if (outcome === 'not_yet_evaluable') {
          result.skippedNotYet += 1
          continue
        }

        result.evaluated += 1
        const eventName =
          outcome === 'retained' ? 'adaptation_retained' : 'adaptation_abandoned'
        if (outcome === 'retained') {
          result.retained += 1
        } else {
          result.abandoned += 1
        }

        await track(client, {
          workspaceId,
          userId: ownerId,
          name: eventName,
          props: {
            suggestion_id: entry.suggestionId,
            suggestion_type: suggestionTypes.get(entry.suggestionId) ?? 'unknown',
            change_log_id: entry.id,
          },
        })

        loggedSuggestionIds.add(entry.suggestionId)
      } catch (err) {
        result.errors.push(
          err instanceof Error ? err.message : `Entry ${entry.id} failed`
        )
      }
    }
  } catch (err) {
    result.errors.push(err instanceof Error ? err.message : 'Workspace load failed')
  }

  return result
}
