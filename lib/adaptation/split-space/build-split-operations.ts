import { randomUUID } from 'node:crypto'

import type { Operation } from '@/lib/adaptation/types'

export type SplitClusterPlan = {
  clusterIndex: number
  name: string
  spaceId: string
  itemIds: string[]
  entityIds: string[]
}

export type SplitSpacePlan = {
  sourceSpaceId: string
  clusters: SplitClusterPlan[]
}

/**
 * Builds apply order: create spaces → move items → move entities.
 * Undo (computed at apply): reverse moves then delete new spaces.
 */
export function buildSplitSpaceOperations(plan: SplitSpacePlan): Operation[] {
  const ops: Operation[] = []
  for (const cluster of plan.clusters) {
    ops.push({
      op: 'create_space',
      space: {
        name: cluster.name,
        preserveSpaceId: cluster.spaceId,
        sortOrder: cluster.clusterIndex,
      },
    })
  }
  for (const cluster of plan.clusters) {
    for (const itemId of cluster.itemIds) {
      ops.push({
        op: 'move_work_item_space',
        itemId,
        spaceId: cluster.spaceId,
      })
    }
    for (const entityId of cluster.entityIds) {
      ops.push({
        op: 'move_entity_space',
        entityId,
        spaceId: cluster.spaceId,
      })
    }
  }
  return ops
}

export function newSplitSpaceIds(count: number): string[] {
  return Array.from({ length: count }, () => randomUUID())
}
