/**
 * Adaptation engine (Node-safe). Next.js app code should call {@link scheduleAdaptation}
 * from `./schedule-adaptation` (server-only), not import this module from client bundles.
 */
import type { DbClient } from '@/lib/db/db-client'
import { listFields } from '@/lib/db/fields'
import { listExtractionsForWorkspaceSince } from '@/lib/db/item-entity-extractions'
import { listItems } from '@/lib/db/items'
import { subDays } from 'date-fns'
import { listRecurrenceRules } from '@/lib/db/recurrence-rules'
import {
  insertPendingSuggestion,
  listRecentSuggestionsForDetection,
} from '@/lib/db/suggestions'
import { listViews } from '@/lib/db/views'
import type { Suggestion } from '@/lib/db/schemas'

import { isWorkspaceInFirstWeek } from './workspace-age'
import { runAllDetectors } from './detectors'
import { selectDraftForPersistence } from './select-draft'

export async function runAdaptation(
  client: DbClient,
  workspaceId: string
): Promise<Suggestion | null> {
  const now = new Date()

  const since = subDays(now, 21).toISOString()
  const [fields, itemsResult, views, recurrenceRules, recentSuggestions, itemExtractions, workspaceRow] =
    await Promise.all([
      listFields(client, workspaceId),
      listItems(client, workspaceId, { limit: 500 }),
      listViews(client, workspaceId),
      listRecurrenceRules(client, workspaceId),
      listRecentSuggestionsForDetection(client, workspaceId, now),
      listExtractionsForWorkspaceSince(client, workspaceId, since),
      client.from('workspaces').select('created_at').eq('id', workspaceId).single(),
    ])

  const workspaceCreatedAt = workspaceRow.data?.created_at ?? now.toISOString()
  const isFirstWeek = isWorkspaceInFirstWeek(workspaceCreatedAt, now)

  const drafts = runAllDetectors({
    workspaceId,
    workspaceCreatedAt,
    isFirstWeek,
    items: itemsResult.items,
    fields,
    views,
    recurrenceRules,
    recentSuggestions,
    itemExtractions,
    now,
  })

  const chosen = selectDraftForPersistence(drafts, recentSuggestions)
  if (!chosen) {
    return null
  }

  return insertPendingSuggestion(client, workspaceId, chosen)
}
