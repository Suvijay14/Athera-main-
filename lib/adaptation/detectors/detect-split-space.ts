import type { Entity, WorkItem } from '@/lib/db/schemas'

import type { SuggestionDraft } from '../detector-types'
import { newSplitSpaceIds, buildSplitSpaceOperations, type SplitSpacePlan } from '../split-space/build-split-operations'
import {
  clusterItemTitles,
  splitDetectorConfidence,
  SPLIT_CONFIDENCE_THRESHOLD,
  type TitleClusterInput,
} from '../split-space/title-clustering'
import { entityFieldKeys, itemsLinkedToEntity } from '@/lib/workspace/entity-items'
import type { FieldDefinition } from '@/lib/db/schemas'

const MIN_OPEN_ITEMS = 20

export type SplitSpaceEvidence = {
  sourceSpaceId: string
  clusterNames: string[]
  /** All items included in the split (for preview assignment UI). */
  splitItems: { id: string; title: string }[]
  clusters: {
    name: string
    spaceId: string
    sampleItems: { id: string; title: string }[]
    itemCount: number
  }[]
  navigateToOverviewAfterAccept: true
}

export function detectSplitSpaceForSpace(input: {
  spaceId: string
  items: WorkItem[]
  fields: FieldDefinition[]
  entities: Entity[]
  clusterNames: string[]
  now: Date
}): SuggestionDraft | null {
  const open = input.items.filter(
    (i) =>
      i.spaceId === input.spaceId &&
      !i.archivedAt &&
      !i.completedAt
  )
  if (open.length < MIN_OPEN_ITEMS) {
    return null
  }

  const clusterInput: TitleClusterInput[] = open.map((i) => ({ id: i.id, title: i.title }))
  const cluster = clusterItemTitles(clusterInput)
  if (!cluster) {
    return null
  }

  const confidence = splitDetectorConfidence(cluster)
  if (confidence < SPLIT_CONFIDENCE_THRESHOLD) {
    return null
  }

  const k = cluster.k
  if (input.clusterNames.length !== k) {
    return null
  }

  const spaceIds = newSplitSpaceIds(k)
  const keys = entityFieldKeys(input.fields)
  const clusters = Array.from({ length: k }, (_, clusterIndex) => {
    const itemIds = open.filter((i) => cluster.assignments.get(i.id) === clusterIndex).map((i) => i.id)
    const entityIds = input.entities
      .filter((e) => e.spaceId === input.spaceId)
      .filter((e) => {
        const linked = itemsLinkedToEntity(open, e.id, keys)
        return linked.length > 0 && linked.every((it) => cluster.assignments.get(it.id) === clusterIndex)
      })
      .map((e) => e.id)

    const sampleItems = open
      .filter((i) => cluster.assignments.get(i.id) === clusterIndex)
      .slice(0, 3)
      .map((i) => ({ id: i.id, title: i.title }))

    return {
      clusterIndex,
      name: input.clusterNames[clusterIndex]!,
      spaceId: spaceIds[clusterIndex]!,
      itemIds,
      entityIds,
      sampleItems,
      itemCount: itemIds.length,
    }
  })

  const exampleTitle = clusters[0]?.sampleItems[0]?.title ?? 'items'
  const reason = `You seem to have ${k} kinds of things in this space (for example "${exampleTitle}" and others). Split them into ${k} spaces?`

  const plan: SplitSpacePlan = {
    sourceSpaceId: input.spaceId,
    clusters: clusters.map((c) => ({
      clusterIndex: c.clusterIndex,
      name: c.name,
      spaceId: c.spaceId,
      itemIds: c.itemIds,
      entityIds: c.entityIds,
    })),
  }

  const evidence: SplitSpaceEvidence = {
    sourceSpaceId: input.spaceId,
    clusterNames: input.clusterNames,
    splitItems: open.map((i) => ({ id: i.id, title: i.title })),
    clusters: clusters.map((c) => ({
      name: c.name,
      spaceId: c.spaceId,
      sampleItems: c.sampleItems,
      itemCount: c.itemCount,
    })),
    navigateToOverviewAfterAccept: true,
  }

  return {
    type: 'split_space',
    reason,
    evidence: evidence as unknown as Record<string, unknown>,
    confidence,
    operations: buildSplitSpaceOperations(plan),
    dedupeKey: `split_space:${input.spaceId}`,
  }
}
