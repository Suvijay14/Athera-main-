import { describe, expect, it } from 'vitest'

import { detectRepeatedEntity } from '@/lib/adaptation/detectors/detect-repeated-entity'
import type { StoredItemExtraction } from '@/lib/db/item-entity-extractions'

import { baseContext, makeField, makeItem, makeSuggestion } from './fixtures'

const spaceId = '00000000-0000-4000-8000-000000000010'
const recentCreatedAt = '2026-02-25T12:00:00.000Z'

function extraction(
  itemId: string,
  name: string,
  confidence = 0.9
): StoredItemExtraction {
  return {
    id: `ext-${itemId}-${name}`,
    workspaceId: '00000000-0000-4000-8000-000000000099',
    workItemId: itemId,
    spaceId,
    name,
    kind: 'client',
    matchesExistingId: null,
    confidence,
    createdAt: new Date().toISOString(),
  }
}

describe('detectRepeatedEntity (extraction-based)', () => {
  it('fires when two clients each appear 2+ times and one appears 3+', () => {
    const danaIds = ['i1', 'i2', 'i3', 'i4', 'i5'] as const
    const items = [
      ...danaIds.map((id) =>
        makeItem({ id, title: `Dana Kim task ${id}`, spaceId, createdAt: recentCreatedAt })
      ),
      makeItem({ id: 'i6', title: 'Acme Corp invoice', spaceId, createdAt: recentCreatedAt }),
      makeItem({ id: 'i7', title: 'Acme Corp call', spaceId, createdAt: recentCreatedAt }),
    ]
    const itemExtractions = [
      ...danaIds.flatMap((id) => [extraction(id, 'Dana Kim')]),
      extraction('i6', 'Acme Corp'),
      extraction('i7', 'Acme Corp'),
    ]
    const draft = detectRepeatedEntity(baseContext({ items, itemExtractions }))
    expect(draft).not.toBeNull()
    expect(draft!.reason).toContain('Dana Kim')
    expect(draft!.operations.some((o) => o.op === 'create_field' && o.field.type === 'entity')).toBe(
      true
    )
    expect(draft!.operations.some((o) => o.op === 'create_entity')).toBe(true)
    expect(draft!.operations.some((o) => o.op === 'create_space')).toBe(true)
    expect(draft!.operations.some((o) => o.op === 'move_work_item_space')).toBe(true)
  })

  it('returns null without extractions', () => {
    const items = Array.from({ length: 5 }, (_, i) =>
      makeItem({ title: `Rivera Plumbing ${i}`, spaceId })
    )
    expect(detectRepeatedEntity(baseContext({ items, itemExtractions: [] }))).toBeNull()
  })

  it('returns null when entity field already exists for kind', () => {
    const items = [
      makeItem({ id: 'i1', title: 'Dana Kim a', spaceId, createdAt: recentCreatedAt }),
      makeItem({ id: 'i2', title: 'Dana Kim b', spaceId, createdAt: recentCreatedAt }),
    ]
    const itemExtractions = [extraction('i1', 'Dana Kim'), extraction('i2', 'Dana Kim')]
    const fields = [
      makeField({
        key: 'client',
        label: 'Client',
        type: 'entity',
        entityKind: 'client',
      }),
    ]
    expect(detectRepeatedEntity(baseContext({ items, itemExtractions, fields }))).toBeNull()
  })

  it('returns null when dedupe blocked', () => {
    const items = [
      makeItem({ id: 'i1', title: 'Dana Kim a', spaceId, createdAt: recentCreatedAt }),
      makeItem({ id: 'i2', title: 'Dana Kim b', spaceId, createdAt: recentCreatedAt }),
      makeItem({ id: 'i3', title: 'Dana Kim c', spaceId, createdAt: recentCreatedAt }),
      makeItem({ id: 'i4', title: 'Other Co a', spaceId, createdAt: recentCreatedAt }),
      makeItem({ id: 'i5', title: 'Other Co b', spaceId, createdAt: recentCreatedAt }),
    ]
    const itemExtractions = [
      extraction('i1', 'Dana Kim'),
      extraction('i2', 'Dana Kim'),
      extraction('i3', 'Dana Kim'),
      extraction('i4', 'Other Co'),
      extraction('i5', 'Other Co'),
    ]
    const recent = [makeSuggestion({ dedupeKey: `repeated-entity:client:${spaceId}` })]
    expect(
      detectRepeatedEntity(baseContext({ items, itemExtractions, recentSuggestions: recent }))
    ).toBeNull()
  })

  it('ignores generic-only extractions (no second entity)', () => {
    const items = Array.from({ length: 4 }, (_, i) =>
      makeItem({ id: `g${i}`, title: `General admin ${i}`, spaceId, createdAt: recentCreatedAt })
    )
    const itemExtractions = items.map((it) => extraction(it.id, 'General'))
    expect(detectRepeatedEntity(baseContext({ items, itemExtractions }))).toBeNull()
  })
})
