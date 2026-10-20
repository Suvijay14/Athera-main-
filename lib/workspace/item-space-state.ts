import type { WorkItem } from '@/lib/db/schemas'

/** Confidence at or above this assigns the item to the classified space. */
export const SPACE_ASSIGN_CONFIDENCE_THRESHOLD = 0.8

/**
 * Unsorted = still in the default space after classification with low confidence.
 * We derive this from space_confidence (null or below threshold) while space_id is default.
 */
export function isUnsortedWorkItem(
  item: Pick<WorkItem, 'spaceId' | 'spaceConfidence'>,
  defaultSpaceId: string
): boolean {
  if (item.spaceId !== defaultSpaceId) {
    return false
  }
  if (item.spaceConfidence === null) {
    return false
  }
  return item.spaceConfidence < SPACE_ASSIGN_CONFIDENCE_THRESHOLD
}

export function listUnsortedWorkItems(
  items: WorkItem[],
  defaultSpaceId: string
): WorkItem[] {
  return items.filter((item) => isUnsortedWorkItem(item, defaultSpaceId))
}
