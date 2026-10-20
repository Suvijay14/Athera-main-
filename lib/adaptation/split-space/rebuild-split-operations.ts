import type { Entity, FieldDefinition, WorkItem } from '@/lib/db/schemas'
import { entityFieldKeys, itemsLinkedToEntity } from '@/lib/workspace/entity-items'

import { buildSplitSpaceOperations, type SplitSpacePlan } from './build-split-operations'
import type { SplitClusterMeta } from './parse-split-suggestion-operations'
import type { Operation } from '../types'

export type { SplitClusterMeta } from './parse-split-suggestion-operations'
export { parseSplitSuggestionOperations } from './parse-split-suggestion-operations'

export function recomputeEntityIdsPerCluster(input: {
  entities: Entity[]
  sourceSpaceId: string
  itemIds: string[]
  itemAssignments: Map<string, string>
  targetSpaceId: string
  fields: FieldDefinition[]
  items: WorkItem[]
}): string[] {
  const keys = entityFieldKeys(input.fields)
  const openSet = new Set(input.itemIds)
  const openItems = input.items.filter((i) => openSet.has(i.id))

  return input.entities
    .filter((e) => e.spaceId === input.sourceSpaceId)
    .filter((e) => {
      const linked = itemsLinkedToEntity(openItems, e.id, keys)
      if (linked.length === 0) {
        return false
      }
      return linked.every((it) => input.itemAssignments.get(it.id) === input.targetSpaceId)
    })
    .map((e) => e.id)
}

export function rebuildSplitSpaceOperations(input: {
  clusters: SplitClusterMeta[]
  sourceSpaceId: string
  itemAssignments: Map<string, string>
  entities: Entity[]
  fields: FieldDefinition[]
  items: WorkItem[]
}): Operation[] {
  const plan: SplitSpacePlan = {
    sourceSpaceId: input.sourceSpaceId,
    clusters: input.clusters.map((c) => ({
      clusterIndex: c.sortOrder,
      name: c.name,
      spaceId: c.spaceId,
      itemIds: [...input.itemAssignments.entries()]
        .filter(([, spaceId]) => spaceId === c.spaceId)
        .map(([itemId]) => itemId),
      entityIds: recomputeEntityIdsPerCluster({
        entities: input.entities,
        sourceSpaceId: input.sourceSpaceId,
        itemIds: [...input.itemAssignments.keys()],
        itemAssignments: input.itemAssignments,
        targetSpaceId: c.spaceId,
        fields: input.fields,
        items: input.items,
      }),
    })),
  }
  return buildSplitSpaceOperations(plan)
}
