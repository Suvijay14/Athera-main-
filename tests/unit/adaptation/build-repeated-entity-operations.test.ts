import { describe, expect, it } from 'vitest'

import { buildRepeatedEntityOperations } from '@/lib/adaptation/build-repeated-entity-operations'
import type { RepeatedEntitySuggestionCandidate } from '@/lib/adaptation/entity-repeated-logic'

const parentSpaceId = '00000000-0000-4000-8000-000000000010'

function candidate(
  partial: Partial<RepeatedEntitySuggestionCandidate> = {}
): RepeatedEntitySuggestionCandidate {
  return {
    kind: 'client',
    spaceId: parentSpaceId,
    primaryName: 'Rivera Bakery',
    primaryNorm: 'rivera bakery',
    itemCount: 4,
    distinctEntityCount: 2,
    confidence: 0.9,
    backfillValues: {
      i1: 'Rivera Bakery',
      i2: 'Rivera Bakery',
      i3: 'Lumen Health',
    },
    evidenceNames: ['Rivera Bakery', 'Lumen Health'],
    ...partial,
  }
}

describe('buildRepeatedEntityOperations', () => {
  it('creates child spaces, moves items, and keeps field + grouped view', () => {
    const ops = buildRepeatedEntityOperations(candidate())
    expect(ops.some((o) => o.op === 'create_field')).toBe(true)
    expect(ops.some((o) => o.op === 'update_space')).toBe(true)
    const childSpaces = ops.filter((o) => o.op === 'create_space')
    expect(childSpaces).toHaveLength(2)
    for (const op of childSpaces) {
      if (op.op === 'create_space') {
        expect(op.space.parentSpaceId).toBe(parentSpaceId)
      }
    }
    const moves = ops.filter((o) => o.op === 'move_work_item_space')
    expect(moves).toHaveLength(3)
    expect(ops.some((o) => o.op === 'backfill_field')).toBe(true)
    expect(ops.some((o) => o.op === 'create_view')).toBe(true)
  })
})
