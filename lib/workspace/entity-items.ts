import type { FieldDefinition, WorkItem } from '@/lib/db/schemas'

export function entityFieldKeys(fields: FieldDefinition[]): string[] {
  return fields.filter((f) => f.type === 'entity').map((f) => f.key)
}

export function itemLinksToEntity(
  item: WorkItem,
  entityId: string,
  fieldKeys: string[]
): boolean {
  for (const key of fieldKeys) {
    const val = item.data[key]
    if (val === entityId) {
      return true
    }
  }
  return false
}

export function itemsLinkedToEntity(
  items: WorkItem[],
  entityId: string,
  fieldKeys: string[]
): WorkItem[] {
  if (fieldKeys.length === 0) {
    return []
  }
  return items.filter((item) => itemLinksToEntity(item, entityId, fieldKeys))
}

/** Open items with no schedule date (spec: undated items archived with entity). */
export function openUndatedItemsForEntity(
  items: WorkItem[],
  entityId: string,
  fieldKeys: string[]
): WorkItem[] {
  return itemsLinkedToEntity(items, entityId, fieldKeys).filter(
    (item) => !item.archivedAt && !item.startAt?.trim() && !item.dueDate?.trim()
  )
}
