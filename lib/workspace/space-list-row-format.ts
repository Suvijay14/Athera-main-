import type { Entity, FieldDefinition } from '@/lib/db/schemas'
import type { DisplayWorkItem } from '@/lib/workspace/merge-recurrence-display-items'
import { entityFieldKeys } from '@/lib/workspace/entity-items'
import { formatWorkItemListWhen } from '@/lib/workspace/format-item-datetime'

export function entityForItem(
  item: DisplayWorkItem,
  entities: Entity[],
  fields: FieldDefinition[]
): Entity | null {
  const keys = entityFieldKeys(fields)
  for (const key of keys) {
    const val = item.data[key]
    if (typeof val === 'string') {
      const ent = entities.find((e) => e.id === val)
      if (ent) {
        return ent
      }
    }
  }
  for (const ent of entities) {
    const norm = ent.name.toLowerCase()
    if (norm.length >= 3 && item.title.toLowerCase().includes(norm)) {
      return ent
    }
  }
  return null
}

/** Mockup list title: "Rivera Bakery · Site review" */
export function formatSpaceListRowTitle(
  item: DisplayWorkItem,
  entities: Entity[],
  fields: FieldDefinition[],
  fallbackSpaceName: string
): string {
  const ent = entityForItem(item, entities, fields)
  const prefix = ent?.name ?? fallbackSpaceName
  let core = item.title.trim()
  if (ent) {
    const escaped = ent.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    core = core.replace(new RegExp(escaped, 'i'), '').replace(/\s+/g, ' ').trim()
    core = core.replace(/^[-–·]\s*/, '').trim()
  }
  if (!core) {
    core = item.title.trim()
  }
  return `${prefix} · ${core}`
}

export function formatSpaceListRowWhen(item: DisplayWorkItem): string {
  return formatWorkItemListWhen(item.dueDate, item.startAt, item.endAt)
}
