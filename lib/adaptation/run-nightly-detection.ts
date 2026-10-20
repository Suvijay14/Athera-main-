import 'server-only'

import type { DbClient } from '@/lib/db/db-client'
import { listFields } from '@/lib/db/fields'
import { listExtractionsForWorkspaceSince } from '@/lib/db/item-entity-extractions'
import { listItems } from '@/lib/db/items'
import { listEntitiesInSpace, updateEntityRhythm } from '@/lib/db/entities'
import { listRecurrenceRules } from '@/lib/db/recurrence-rules'
import { insertPendingSuggestion, listRecentSuggestionsForDetection } from '@/lib/db/suggestions'
import { listSpaces } from '@/lib/db/spaces'
import { listViews } from '@/lib/db/views'
import type { Suggestion } from '@/lib/db/schemas'
import { subDays } from 'date-fns'

import { computeEntityRhythm } from './entity-rhythm'
import { runAllDetectors } from './detectors'
import {
  detectArchiveEntity,
  type ArchiveEntityCandidate,
} from './detectors/detect-archive-entity'
import { selectDraftForPersistence } from './select-draft'
import { isWorkspaceInFirstWeek } from './workspace-age'
import { entityFieldKeys, itemsLinkedToEntity } from '@/lib/workspace/entity-items'
import { entityHasActiveRecurrence } from '@/lib/workspace/recurrence-entity'
import { detectSplitSpaceForSpace } from './detectors/detect-split-space'
import { clusterItemTitles, splitDetectorConfidence, SPLIT_CONFIDENCE_THRESHOLD } from './split-space/title-clustering'
import { nameClustersFromSamples } from '@/lib/llm/name-clusters'
import { listEntitiesForWorkspace } from '@/lib/db/entities'

export async function runNightlyDetectionForWorkspace(
  client: DbClient,
  workspaceId: string,
  now = new Date()
): Promise<Suggestion | null> {
  const since = subDays(now, 21).toISOString()
  const [fields, itemsResult, views, recurrenceRules, recentSuggestions, itemExtractions, spaces, workspaceRow] =
    await Promise.all([
      listFields(client, workspaceId),
      listItems(client, workspaceId, { limit: 2000 }),
      listViews(client, workspaceId),
      listRecurrenceRules(client, workspaceId),
      listRecentSuggestionsForDetection(client, workspaceId, now),
      listExtractionsForWorkspaceSince(client, workspaceId, since),
      listSpaces(client, workspaceId),
      client.from('workspaces').select('created_at').eq('id', workspaceId).single(),
    ])

  const workspaceCreatedAt = workspaceRow.data?.created_at ?? now.toISOString()
  const isFirstWeek = isWorkspaceInFirstWeek(workspaceCreatedAt, now)

  const fieldKeys = entityFieldKeys(fields)
  const items = itemsResult.items

  const archiveDrafts = []
  for (const space of spaces.filter((s) => !s.archivedAt)) {
    const entities = await listEntitiesInSpace(client, workspaceId, space.id)
    const candidates: ArchiveEntityCandidate[] = []

    for (const entity of entities) {
      const linked = itemsLinkedToEntity(items, entity.id, fieldKeys)
      let rhythm = computeEntityRhythm(entity.id, linked, now)
      if (entityHasActiveRecurrence(entity.id, items, recurrenceRules, fieldKeys)) {
        rhythm = { ...rhythm, hasFutureItems: true }
      }
      await updateEntityRhythm(client, workspaceId, entity.id, {
        typicalGapDays: rhythm.typicalGapDays,
        lastActivityAt: rhythm.lastActivityAt,
      })
      candidates.push({
        entityId: entity.id,
        name: entity.name,
        kind: entity.kind,
        createdAt: entity.createdAt,
        excludedFromSuggestions: entity.excludedFromSuggestions,
        rhythm,
      })
    }

    const draft = detectArchiveEntity({ spaceId: space.id, now, candidates })
    if (draft) {
      archiveDrafts.push(draft)
    }
  }

  const splitDrafts = []
  const entities = await listEntitiesForWorkspace(client, workspaceId)
  for (const space of spaces.filter((s) => !s.archivedAt && !s.isDefault)) {
    const open = items.filter(
      (i) => i.spaceId === space.id && !i.archivedAt && !i.completedAt
    )
    const cluster = clusterItemTitles(open.map((i) => ({ id: i.id, title: i.title })))
    if (!cluster || splitDetectorConfidence(cluster) < SPLIT_CONFIDENCE_THRESHOLD) {
      continue
    }
    const samples: string[][] = []
    for (let c = 0; c < cluster.k; c++) {
      samples.push(
        open
          .filter((i) => cluster.assignments.get(i.id) === c)
          .slice(0, 10)
          .map((i) => i.title)
      )
    }
    try {
      const clusterNames = await nameClustersFromSamples(samples)
      const draft = detectSplitSpaceForSpace({
        spaceId: space.id,
        items,
        fields,
        entities,
        clusterNames,
        now,
      })
      if (draft) {
        splitDrafts.push(draft)
      }
    } catch {
      // LLM unavailable — skip split suggestion for this space tonight
    }
  }

  const saveDrafts = runAllDetectors({
    workspaceId,
    workspaceCreatedAt,
    isFirstWeek,
    items,
    fields,
    views,
    recurrenceRules,
    recentSuggestions,
    itemExtractions,
    now,
  })

  const chosen = selectDraftForPersistence(
    [...archiveDrafts, ...splitDrafts, ...saveDrafts],
    recentSuggestions
  )
  if (!chosen) {
    return null
  }
  return insertPendingSuggestion(client, workspaceId, chosen)
}

export async function listAllWorkspaceIds(client: DbClient): Promise<string[]> {
  const { data, error } = await client.from('workspaces').select('id')
  if (error) {
    throw error
  }
  return (data ?? []).map((r) => r.id as string)
}
