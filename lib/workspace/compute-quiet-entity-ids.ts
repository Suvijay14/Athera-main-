import { differenceInDays } from 'date-fns'

import type { Entity, FieldDefinition, RecurrenceRule, WorkItem } from '@/lib/db/schemas'
import {
  isArchiveCandidateEntity,
  type ArchiveEntityCandidate,
} from '@/lib/adaptation/detectors/detect-archive-entity'
import { computeEntityRhythm } from '@/lib/adaptation/entity-rhythm'
import { entityFieldKeys, itemsLinkedToEntity } from '@/lib/workspace/entity-items'
import { entityHasActiveRecurrence } from '@/lib/workspace/recurrence-entity'

export type QuietEntityDetail = {
  entityId: string
  weeksQuiet: number
}

function weeksSinceActivity(lastActivityAt: Date, now: Date): number {
  return Math.max(1, Math.round(differenceInDays(now, lastActivityAt) / 7))
}

export function computeQuietEntityDetails(
  entities: Entity[],
  items: WorkItem[],
  fields: FieldDefinition[],
  recurrenceRules: RecurrenceRule[],
  now: Date
): QuietEntityDetail[] {
  const fieldKeys = entityFieldKeys(fields)
  const quiet: QuietEntityDetail[] = []

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
    if (isArchiveCandidateEntity(candidate, now) && rhythm.lastActivityAt) {
      quiet.push({
        entityId: entity.id,
        weeksQuiet: weeksSinceActivity(rhythm.lastActivityAt, now),
      })
    }
  }

  return quiet
}

export function computeQuietEntityIds(
  entities: Entity[],
  items: WorkItem[],
  fields: FieldDefinition[],
  recurrenceRules: RecurrenceRule[],
  now: Date
): Set<string> {
  return new Set(
    computeQuietEntityDetails(entities, items, fields, recurrenceRules, now).map((q) => q.entityId)
  )
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
