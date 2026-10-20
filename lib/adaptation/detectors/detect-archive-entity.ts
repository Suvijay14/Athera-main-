import { differenceInDays, parseISO } from 'date-fns'

import type { SuggestionDraft } from '@/lib/adaptation/detector-types'
import type { Operation } from '@/lib/adaptation/types'

import type { EntityRhythmResult } from '../entity-rhythm'

/** Entity must exist at least this long before archive suggestion (spec). */
export const ARCHIVE_MIN_ENTITY_AGE_DAYS = 30

/** Minimum dated items linked to the entity (spec). */
export const ARCHIVE_MIN_DATED_ITEMS = 3

/** Confidence at 3 dated items (spec). */
export const ARCHIVE_CONFIDENCE_AT_MIN_ITEMS = 0.8

/** Confidence from 8+ dated items (spec). */
export const ARCHIVE_CONFIDENCE_AT_MAX_ITEMS = 0.95

/** Linear ramp from 3 items (0.8) to 8 items (0.95), capped at 0.95. */
export function archiveConfidenceFromDatedItemCount(datedItemCount: number): number {
  if (datedItemCount < ARCHIVE_MIN_DATED_ITEMS) {
    return ARCHIVE_CONFIDENCE_AT_MIN_ITEMS
  }
  if (datedItemCount >= 8) {
    return ARCHIVE_CONFIDENCE_AT_MAX_ITEMS
  }
  const span = 8 - ARCHIVE_MIN_DATED_ITEMS
  const t = (datedItemCount - ARCHIVE_MIN_DATED_ITEMS) / span
  return ARCHIVE_CONFIDENCE_AT_MIN_ITEMS + t * (ARCHIVE_CONFIDENCE_AT_MAX_ITEMS - ARCHIVE_CONFIDENCE_AT_MIN_ITEMS)
}

export function archiveInactivityThresholdDays(typicalGapDays: number): number {
  return Math.max(2.5 * typicalGapDays, typicalGapDays + 14, 21)
}

export type ArchiveEntityCandidate = {
  entityId: string
  name: string
  kind: string
  createdAt: string
  excludedFromSuggestions: boolean
  rhythm: EntityRhythmResult
}

export type ArchiveDetectionInput = {
  spaceId: string
  now: Date
  candidates: ArchiveEntityCandidate[]
}

function weeksSince(date: Date, now: Date): number {
  return Math.max(1, Math.round(differenceInDays(now, date) / 7))
}

function gapLabel(typicalGapDays: number | null): string {
  if (typicalGapDays === null) {
    return ''
  }
  if (typicalGapDays <= 8) {
    return 'weekly'
  }
  if (typicalGapDays <= 16) {
    return 'every couple of weeks'
  }
  return `about every ${Math.round(typicalGapDays)} days`
}

/** Same gate as archive-entities suggestion (Task 13) — for "Quiet" nav label. */
export function isArchiveCandidateEntity(candidate: ArchiveEntityCandidate, now: Date): boolean {
  if (candidate.excludedFromSuggestions) {
    return false
  }
  const ageDays = differenceInDays(now, parseISO(candidate.createdAt))
  if (ageDays < ARCHIVE_MIN_ENTITY_AGE_DAYS) {
    return false
  }
  const { rhythm } = candidate
  if (rhythm.hasFutureItems) {
    return false
  }
  if (rhythm.datedItemCount < ARCHIVE_MIN_DATED_ITEMS) {
    return false
  }
  if (rhythm.typicalGapDays === null || !rhythm.lastActivityAt) {
    return false
  }
  const threshold = archiveInactivityThresholdDays(rhythm.typicalGapDays)
  const inactiveDays = differenceInDays(now, rhythm.lastActivityAt)
  return inactiveDays >= threshold
}

function buildReason(qualifying: ArchiveEntityCandidate[], now: Date): string {
  if (qualifying.length === 1) {
    const e = qualifying[0]!
    const weeks = weeksSince(e.rhythm.lastActivityAt!, now)
    const cadence = gapLabel(e.rhythm.typicalGapDays)
    const cadencePhrase = cadence ? ` He usually comes ${cadence}.` : ''
    return `${e.name} hasn't had a session in ${weeks} week${weeks === 1 ? '' : 's'}.${cadencePhrase}`
  }
  return `${qualifying.length} students haven't had sessions in over a month.`
}

export function detectArchiveEntity(input: ArchiveDetectionInput): SuggestionDraft | null {
  const qualifying = input.candidates.filter((c) => isArchiveCandidateEntity(c, input.now))
  if (qualifying.length === 0) {
    return null
  }

  const operations: Operation[] = qualifying.map((e) => ({
    op: 'archive_entity',
    entityId: e.entityId,
  }))

  const confidence = Math.max(
    ...qualifying.map((e) => archiveConfidenceFromDatedItemCount(e.rhythm.datedItemCount))
  )

  return {
    type: 'archive-entities',
    reason: buildReason(qualifying, input.now),
    evidence: {
      spaceId: input.spaceId,
      entityIds: qualifying.map((e) => e.entityId),
      entities: qualifying.map((e) => ({
        id: e.entityId,
        name: e.name,
        kind: e.kind,
        datedItemCount: e.rhythm.datedItemCount,
        typicalGapDays: e.rhythm.typicalGapDays,
        lastActivityAt: e.rhythm.lastActivityAt?.toISOString() ?? null,
      })),
    },
    confidence,
    operations,
    dedupeKey: `archive:space:${input.spaceId}`,
  }
}
