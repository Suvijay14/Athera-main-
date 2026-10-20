import { subDays } from 'date-fns'

import type { FieldDefinition, WorkItem } from '@/lib/db/schemas'
import type { StoredItemExtraction } from '@/lib/db/item-entity-extractions'

import { normalizeEntityKey } from './detector-utils'

/** Spec 1a: at least 3 items in 21 days for one entity. */
export const REPEATED_ENTITY_ITEM_THRESHOLD = 3

/** Spec 1a: confidence threshold after formula. */
export const REPEATED_ENTITY_CONFIDENCE_THRESHOLD = 0.75

export const REPEATED_ENTITY_WINDOW_DAYS = 21

export type EntityKindCandidate = {
  kind: string
  spaceId: string
  /** normalized name -> { display, itemIds, confidences } */
  byName: Map<
    string,
    { display: string; itemIds: string[]; confidences: number[] }
  >
}

export function hasEntityFieldForKind(fields: FieldDefinition[], kind: string): boolean {
  const norm = kind.toLowerCase()
  return fields.some(
    (f) => f.type === 'entity' && (f.entityKind?.toLowerCase() === norm || f.key.toLowerCase() === norm)
  )
}

export function buildCandidatesFromExtractions(
  items: WorkItem[],
  extractions: StoredItemExtraction[],
  now: Date
): EntityKindCandidate[] {
  const since = subDays(now, REPEATED_ENTITY_WINDOW_DAYS)
  const itemIdsRecent = new Set(
    items.filter((i) => new Date(i.createdAt) >= since).map((i) => i.id)
  )

  const bySpaceKind = new Map<string, EntityKindCandidate>()

  for (const ext of extractions) {
    if (!itemIdsRecent.has(ext.workItemId)) {
      continue
    }
    const key = `${ext.spaceId}:${ext.kind.toLowerCase()}`
    let bucket = bySpaceKind.get(key)
    if (!bucket) {
      bucket = { kind: ext.kind.toLowerCase(), spaceId: ext.spaceId, byName: new Map() }
      bySpaceKind.set(key, bucket)
    }
    const norm = normalizeEntityKey(ext.name)
    const entry = bucket.byName.get(norm) ?? {
      display: ext.name.trim(),
      itemIds: [],
      confidences: [],
    }
    if (!entry.itemIds.includes(ext.workItemId)) {
      entry.itemIds.push(ext.workItemId)
    }
    entry.confidences.push(ext.confidence)
    bucket.byName.set(norm, entry)
  }

  return [...bySpaceKind.values()]
}

export type RepeatedEntitySuggestionCandidate = {
  kind: string
  spaceId: string
  primaryName: string
  primaryNorm: string
  itemCount: number
  distinctEntityCount: number
  confidence: number
  backfillValues: Record<string, string>
  evidenceNames: string[]
}

export type PickRepeatedEntityOptions = {
  /** Task 19: single prominent entity with 3+ mentions can fire during first week. */
  firstWeek?: boolean
}

export function pickRepeatedEntityCandidate(
  candidates: EntityKindCandidate[],
  fields: FieldDefinition[],
  options: PickRepeatedEntityOptions = {}
): RepeatedEntitySuggestionCandidate | null {
  const firstWeek = options.firstWeek ?? false
  const minDistinctWithTwoPlus = firstWeek ? 1 : 2
  const confidenceLengthDivisor = firstWeek ? 3 : 6
  let best: RepeatedEntitySuggestionCandidate | null = null

  for (const bucket of candidates) {
    if (hasEntityFieldForKind(fields, bucket.kind)) {
      continue
    }

    const qualifying = [...bucket.byName.entries()].filter(
      ([, v]) => v.itemIds.length >= 2
    )
    if (qualifying.length < minDistinctWithTwoPlus) {
      continue
    }

    const primary = qualifying.sort((a, b) => b[1].itemIds.length - a[1].itemIds.length)[0]
    if (!primary) {
      continue
    }
    const [primaryNorm, primaryEntry] = primary
    if (primaryEntry.itemIds.length < REPEATED_ENTITY_ITEM_THRESHOLD) {
      continue
    }
    const othersWithTwoPlus = qualifying.filter(([, v]) => v.itemIds.length >= 2).length
    if (othersWithTwoPlus < minDistinctWithTwoPlus) {
      continue
    }

    const avgConf =
      primaryEntry.confidences.reduce((s, c) => s + c, 0) / primaryEntry.confidences.length
    const confidence = avgConf * Math.min(1, primaryEntry.itemIds.length / confidenceLengthDivisor)
    if (confidence < REPEATED_ENTITY_CONFIDENCE_THRESHOLD) {
      continue
    }

    const backfillValues: Record<string, string> = {}
    for (const [norm, entry] of qualifying) {
      for (const itemId of entry.itemIds) {
        backfillValues[itemId] = entry.display
      }
      void norm
    }

    const candidate: RepeatedEntitySuggestionCandidate = {
      kind: bucket.kind,
      spaceId: bucket.spaceId,
      primaryName: primaryEntry.display,
      primaryNorm,
      itemCount: primaryEntry.itemIds.length,
      distinctEntityCount: qualifying.length,
      confidence,
      backfillValues,
      evidenceNames: qualifying.map(([, e]) => e.display),
    }

    if (!best || candidate.confidence > best.confidence) {
      best = candidate
    }
  }

  return best
}
