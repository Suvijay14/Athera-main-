import type { Entity, FieldDefinition, RecurrenceRule, WorkItem } from '@/lib/db/schemas'
import {
  isArchiveCandidateEntity,
  type ArchiveEntityCandidate,
} from '@/lib/adaptation/detectors/detect-archive-entity'
import { computeEntityRhythm } from '@/lib/adaptation/entity-rhythm'
import { entityFieldKeys, itemsLinkedToEntity } from '@/lib/workspace/entity-items'
import { entityHasActiveRecurrence } from '@/lib/workspace/recurrence-entity'

export function computeQuietEntityIds(
  entities: Entity[],
  items: WorkItem[],
  fields: FieldDefinition[],
  recurrenceRules: RecurrenceRule[],
  now: Date
): Set<string> {
  const fieldKeys = entityFieldKeys(fields)
  const quiet = new Set<string>()

  for (const entity of entities) {
    if (entity.archivedAt) {
      continue
    }
    const linked = itemsLinkedToEntity(items, entity.id, fieldKeys)
    let rhythm = computeEntityRhythm(entity.id, linked, now)
    if (entityHasActiveRecurrence(entity.id, items, recurrenceRules, fieldKeys)) {
      rhythm = { ...rhythm, hasFutureItems: true }
    }
    const candidate: ArchiveEntityCandidate = {
      entityId: entity.id,
      name: entity.name,
      kind: entity.kind,
      createdAt: entity.createdAt,
      excludedFromSuggestions: entity.excludedFromSuggestions,
      rhythm,
    }
    if (isArchiveCandidateEntity(candidate, now)) {
      quiet.add(entity.id)
    }
  }

  return quiet
}

export function groupEntitiesBySpace(entities: Entity[]): Map<string, Entity[]> {
  const map = new Map<string, Entity[]>()
  for (const entity of entities) {
    if (entity.archivedAt) {
      continue
    }
    const list = map.get(entity.spaceId) ?? []
    list.push(entity)
    map.set(entity.spaceId, list)
  }
  for (const [, list] of map) {
    list.sort((a, b) => a.name.localeCompare(b.name))
  }
  return map
}

export function entityNavInitial(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) {
    return '?'
  }
  return trimmed[0]!.toUpperCase()
}
