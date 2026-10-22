import { describe, expect, it } from 'vitest'

import { detectRepeatedEntity } from '@/lib/adaptation/detectors/detect-repeated-entity'
import { pickRepeatedEntityCandidate, buildCandidatesFromExtractions } from '@/lib/adaptation/entity-repeated-logic'
import type { StoredItemExtraction } from '@/lib/db/item-entity-extractions'

import { baseContext, makeItem } from '../detectors/fixtures'

const spaceId = '00000000-0000-4000-8000-000000000010'
const recentCreatedAt = '2026-03-10T12:00:00.000Z'

function extraction(itemId: string, name: string): StoredItemExtraction {
  return {
    id: `ext-${itemId}`,
    workspaceId: '00000000-0000-4000-8000-000000000099',
    workItemId: itemId,
    spaceId,
    name,
    kind: 'client',
    matchesExistingId: null,
    confidence: 0.9,
    createdAt: new Date().toISOString(),
  }
}

describe('first-week lowered thresholds', () => {
  it('repeated entity fires for one name x3 in first week via confidence divisor', () => {
    const ids = ['i1', 'i2', 'i3'] as const
    const items = ids.map((id) =>
      makeItem({ id, title: `Rivera ${id}`, spaceId, createdAt: recentCreatedAt })
    )
    const itemExtractions = ids.map((id) => extraction(id, 'Rivera Plumbing'))
    const draft = detectRepeatedEntity(
      baseContext({
        items,
        itemExtractions,
        isFirstWeek: true,
        workspaceCreatedAt: '2026-03-14T00:00:00.000Z',
        now: new Date('2026-03-15T12:00:00.000Z'),
      })
    )
    expect(draft).not.toBeNull()

    const mature = detectRepeatedEntity(
      baseContext({
        items,
        itemExtractions,
        isFirstWeek: false,
        now: new Date('2026-03-15T12:00:00.000Z'),
      })
    )
    expect(mature).toBeNull()
  })

  it('pickRepeatedEntityCandidate confidence uses n/3 in first week', () => {
    const candidates = buildCandidatesFromExtractions(
      [
        makeItem({ id: '1', title: 'a', spaceId, createdAt: recentCreatedAt }),
        makeItem({ id: '2', title: 'b', spaceId, createdAt: recentCreatedAt }),
        makeItem({ id: '3', title: 'c', spaceId, createdAt: recentCreatedAt }),
      ],
      [extraction('1', 'Acme'), extraction('2', 'Acme'), extraction('3', 'Acme')],
      new Date('2026-03-15T12:00:00.000Z')
    )
    expect(pickRepeatedEntityCandidate(candidates, [], { firstWeek: true })).not.toBeNull()
    expect(pickRepeatedEntityCandidate(candidates, [], { firstWeek: false })).toBeNull()
  })
})
