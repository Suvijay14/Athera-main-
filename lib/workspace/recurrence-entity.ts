import type { RecurrenceRule, WorkItem } from '@/lib/db/schemas'

import { itemLinksToEntity } from './entity-items'

/** Active recurrence linked through any item for this entity counts as "future" for archive (spec Feature 2). */
export function entityHasActiveRecurrence(
  entityId: string,
  items: WorkItem[],
  rules: RecurrenceRule[],
  entityFieldKeys: string[]
): boolean {
  if (entityFieldKeys.length === 0) {
    return false
  }
  const activeRuleIds = new Set(rules.filter((r) => r.active).map((r) => r.id))
  for (const item of items) {
    if (!item.recurrenceId || !activeRuleIds.has(item.recurrenceId)) {
      continue
    }
    if (itemLinksToEntity(item, entityId, entityFieldKeys)) {
      return true
    }
  }
  return false
}
