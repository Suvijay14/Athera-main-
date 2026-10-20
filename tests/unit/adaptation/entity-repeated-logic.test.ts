import { describe, expect, it } from 'vitest'

import {
  pickRepeatedEntityCandidate,
  buildCandidatesFromExtractions,
  REPEATED_ENTITY_CONFIDENCE_THRESHOLD,
} from '@/lib/adaptation/entity-repeated-logic'
import type { StoredItemExtraction } from '@/lib/db/item-entity-extractions'

import { makeField, makeItem } from '../detectors/fixtures'

const spaceId = '00000000-0000-4000-8000-000000000010'

describe('entity-repeated-logic', () => {
  it('computes confidence with count factor', () => {
    const now = new Date('2026-03-01T12:00:00.000Z')
    const items = [
      makeItem({ id: '1', title: 'Dana Kim 1', spaceId, createdAt: '2026-02-20T00:00:00.000Z' }),
      makeItem({ id: '2', title: 'Dana Kim 2', spaceId, createdAt: '2026-02-21T00:00:00.000Z' }),
      makeItem({ id: '3', title: 'Dana Kim 3', spaceId, createdAt: '2026-02-22T00:00:00.000Z' }),
      makeItem({ id: '4', title: 'Dana Kim 4', spaceId, createdAt: '2026-02-23T00:00:00.000Z' }),
      makeItem({ id: '5', title: 'Dana Kim 5', spaceId, createdAt: '2026-02-24T00:00:00.000Z' }),
      makeItem({ id: '6', title: 'Dana Kim 6', spaceId, createdAt: '2026-02-25T00:00:00.000Z' }),
    ]
    const extractions: StoredItemExtraction[] = [
      ...['1', '2', '3', '4', '5', '6'].map((id) => ({
        id: `e${id}`,
        workspaceId: 'w',
        workItemId: id,
        spaceId,
        name: 'Dana Kim',
        kind: 'client',
        matchesExistingId: null,
        confidence: 0.9,
        createdAt: '2026-02-25T00:00:00.000Z',
      })),
      ...['1', '2'].map((id) => ({
        id: `a${id}`,
        workspaceId: 'w',
        workItemId: id,
        spaceId,
        name: 'Acme Corp',
        kind: 'client',
        matchesExistingId: null,
        confidence: 0.9,
        createdAt: '2026-02-25T00:00:00.000Z',
      })),
    ]
    const candidates = buildCandidatesFromExtractions(items, extractions, now)
    const picked = pickRepeatedEntityCandidate(candidates, [])
    expect(picked).not.toBeNull()
    expect(picked!.confidence).toBeGreaterThanOrEqual(REPEATED_ENTITY_CONFIDENCE_THRESHOLD)
  })

  it('returns null when entity field exists', () => {
    const candidates = buildCandidatesFromExtractions([], [], new Date())
    expect(
      pickRepeatedEntityCandidate(candidates, [
        makeField({ key: 'client', label: 'Client', type: 'entity', entityKind: 'client' }),
      ])
    ).toBeNull()
  })
})
