import { describe, expect, it } from 'vitest'

import {
  ARCHIVE_MIN_DATED_ITEMS,
  archiveConfidenceFromDatedItemCount,
  archiveInactivityThresholdDays,
  detectArchiveEntity,
  type ArchiveEntityCandidate,
} from '@/lib/adaptation/detectors/detect-archive-entity'
import type { EntityRhythmResult } from '@/lib/adaptation/entity-rhythm'

const now = new Date('2026-03-15T12:00:00.000Z')

function rhythm(partial: Partial<EntityRhythmResult>): EntityRhythmResult {
  return {
    typicalGapDays: 7,
    lastActivityAt: new Date('2026-01-01T00:00:00.000Z'),
    hasFutureItems: false,
    datedItemCount: 4,
    ...partial,
  }
}

function candidate(partial: Partial<ArchiveEntityCandidate>): ArchiveEntityCandidate {
  return {
    entityId: partial.entityId ?? 'e1',
    name: partial.name ?? 'Max',
    kind: 'student',
    createdAt: partial.createdAt ?? '2025-01-01T00:00:00.000Z',
    excludedFromSuggestions: false,
    rhythm: partial.rhythm ?? rhythm({}),
    ...partial,
  }
}

describe('archiveConfidenceFromDatedItemCount', () => {
  it('ramps from 0.8 at 3 items to 0.95 at 8+', () => {
    expect(archiveConfidenceFromDatedItemCount(3)).toBeCloseTo(0.8)
    expect(archiveConfidenceFromDatedItemCount(8)).toBeCloseTo(0.95)
    expect(archiveConfidenceFromDatedItemCount(20)).toBeCloseTo(0.95)
  })
})

describe('archiveInactivityThresholdDays', () => {
  it('uses max of formula terms', () => {
    expect(archiveInactivityThresholdDays(7)).toBe(21)
    expect(archiveInactivityThresholdDays(14)).toBe(35)
  })
})

describe('detectArchiveEntity', () => {
  it('fires for inactive entity with rhythm', () => {
    const draft = detectArchiveEntity({
      spaceId: '00000000-0000-4000-8000-000000000010',
      now,
      candidates: [
        candidate({
          rhythm: rhythm({
            typicalGapDays: 7,
            lastActivityAt: new Date('2025-12-01T00:00:00.000Z'),
            datedItemCount: 5,
          }),
        }),
      ],
    })
    expect(draft).not.toBeNull()
    expect(draft!.type).toBe('archive-entities')
    expect(draft!.reason).toContain('Max')
    expect(draft!.dedupeKey).toContain('archive:space:')
  })

  it('combines multiple qualifying entities', () => {
    const draft = detectArchiveEntity({
      spaceId: '00000000-0000-4000-8000-000000000010',
      now,
      candidates: [
        candidate({ entityId: 'e1', name: 'A' }),
        candidate({ entityId: 'e2', name: 'B' }),
        candidate({ entityId: 'e3', name: 'C' }),
      ],
    })
    expect(draft!.operations).toHaveLength(3)
    expect(draft!.reason).toContain('3')
  })

  it('skips excluded and future-item entities', () => {
    const draft = detectArchiveEntity({
      spaceId: 's',
      now,
      candidates: [
        candidate({ excludedFromSuggestions: true }),
        candidate({ rhythm: rhythm({ hasFutureItems: true }) }),
      ],
    })
    expect(draft).toBeNull()
  })

  it('skips young entities', () => {
    const draft = detectArchiveEntity({
      spaceId: 's',
      now,
      candidates: [
        candidate({
          createdAt: '2026-03-01T00:00:00.000Z',
          rhythm: rhythm({ datedItemCount: ARCHIVE_MIN_DATED_ITEMS }),
        }),
      ],
    })
    expect(draft).toBeNull()
  })
})
