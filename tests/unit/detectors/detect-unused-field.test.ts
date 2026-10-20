import { describe, expect, it } from 'vitest'

import { detectUnusedField } from '@/lib/adaptation/detectors/detect-unused-field'

import { baseContext, makeField, makeItem, makeSuggestion } from './fixtures'

describe('detectUnusedField', () => {
  const oldField = makeField({
    key: 'legacy_ref',
    label: 'Legacy ref',
    createdAt: '2026-01-01T12:00:00.000Z',
  })

  it('fires when an old field is rarely filled', () => {
    const items = Array.from({ length: 12 }, (_, i) =>
      makeItem({
        title: `Item ${i}`,
        createdAt: '2026-02-01T12:00:00.000Z',
        data: {},
      })
    )
    const draft = detectUnusedField(
      baseContext({
        fields: [oldField],
        items,
        now: new Date('2026-03-01T12:00:00.000Z'),
      })
    )
    expect(draft).not.toBeNull()
    expect(draft!.dedupeKey).toBe('unused-field:legacy_ref')
  })

  it('returns null when field is younger than 14 days', () => {
    const young = makeField({
      key: 'new_field',
      label: 'New',
      createdAt: '2026-02-20T12:00:00.000Z',
    })
    const items = Array.from({ length: 12 }, (_, i) =>
      makeItem({ title: `Item ${i}`, createdAt: '2026-02-21T12:00:00.000Z' })
    )
    expect(
      detectUnusedField(
        baseContext({
          fields: [young],
          items,
          now: new Date('2026-03-01T12:00:00.000Z'),
        })
      )
    ).toBeNull()
  })

  it('returns null when fill rate is high enough', () => {
    const items = Array.from({ length: 12 }, (_, i) =>
      makeItem({
        title: `Item ${i}`,
        createdAt: '2026-02-01T12:00:00.000Z',
        data: { legacy_ref: i < 6 ? 'x' : '' },
      })
    )
    expect(
      detectUnusedField(
        baseContext({
          fields: [oldField],
          items,
          now: new Date('2026-03-01T12:00:00.000Z'),
        })
      )
    ).toBeNull()
  })

  it('returns null when dedupe blocked', () => {
    const items = Array.from({ length: 12 }, () =>
      makeItem({ title: 'x', createdAt: '2026-02-01T12:00:00.000Z' })
    )
    const recent = [makeSuggestion({ dedupeKey: 'unused-field:legacy_ref' })]
    expect(
      detectUnusedField(
        baseContext({
          fields: [oldField],
          items,
          recentSuggestions: recent,
          now: new Date('2026-03-01T12:00:00.000Z'),
        })
      )
    ).toBeNull()
  })
})
