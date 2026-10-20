import type { Operation } from '../types'
import { operationsSchema } from '../types'

export type SplitClusterMeta = {
  name: string
  spaceId: string
  sortOrder: number
}

/** Client-safe parser (no Node built-ins). */
export function parseSplitSuggestionOperations(operations: Operation[]): {
  clusters: SplitClusterMeta[]
  itemIds: string[]
  initialAssignments: Map<string, string>
} {
  const parsed = operationsSchema.parse(operations)
  const clusters: SplitClusterMeta[] = []
  const initialAssignments = new Map<string, string>()
  const itemIds: string[] = []

  for (const op of parsed) {
    if (op.op === 'create_space') {
      clusters.push({
        name: op.space.name,
        spaceId: op.space.preserveSpaceId ?? '',
        sortOrder: op.space.sortOrder ?? clusters.length,
      })
    }
  }

  for (const op of parsed) {
    if (op.op === 'move_work_item_space') {
      itemIds.push(op.itemId)
      initialAssignments.set(op.itemId, op.spaceId)
    }
  }

  return { clusters, itemIds, initialAssignments }
}
