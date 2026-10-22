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
  const activeRules = rules.filter((r) => r.active)
  const activeRuleIds = new Set(activeRules.map((r) => r.id))
  for (const item of items) {
    if (!item.recurrenceId || !activeRuleIds.has(item.recurrenceId)) {
      continue
    }
    if (itemLinksToEntity(item, entityId, entityFieldKeys)) {
      return true
    }
  }
  for (const rule of activeRules) {
    const raw = rule.templateItem.data
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
      continue
    }
    const data = raw as Record<string, unknown>
    for (const key of entityFieldKeys) {
      if (data[key] === entityId) {
        return true
      }
    }
  }
  return false
}
