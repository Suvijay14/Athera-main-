import { describe, expect, it } from 'vitest'

import type { FieldDefinition } from '@/lib/db/schemas'
import { validateItemData } from '@/lib/db/validate-item-data'

const baseField = (overrides: Partial<FieldDefinition>): FieldDefinition => ({
  id: '00000000-0000-4000-8000-000000000001',
  workspaceId: '00000000-0000-4000-8000-000000000099',
  key: 'sample',
  label: 'Sample',
  type: 'text',
  options: [],
  entityKind: null,
  visible: true,
  position: 0,
  source: 'user',
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

describe('validateItemData', () => {
  const fields: FieldDefinition[] = [
    baseField({ key: 'note_text', type: 'text' }),
    baseField({ key: 'qty', type: 'number' }),
    baseField({ key: 'due', type: 'date' }),
    baseField({ key: 'tier', type: 'select', options: ['a', 'b'] }),
    baseField({ key: 'done', type: 'checkbox' }),
  ]

  it('rejects unknown keys', () => {
    const result = validateItemData({ unknown_key: 'x' }, fields)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors[0]?.key).toBe('unknown_key')
    }
  })

  it('allows null to clear', () => {
    const result = validateItemData({ note_text: null }, fields)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.note_text).toBeNull()
    }
  })

  it('validates each field type', () => {
    expect(validateItemData({ note_text: 'hello' }, fields).ok).toBe(true)
    expect(validateItemData({ qty: 3 }, fields).ok).toBe(true)
    expect(validateItemData({ due: '2026-10-10' }, fields).ok).toBe(true)
    expect(validateItemData({ tier: 'a' }, fields).ok).toBe(true)
    expect(validateItemData({ done: true }, fields).ok).toBe(true)
  })

  it('rejects invalid values', () => {
    expect(validateItemData({ qty: NaN }, fields).ok).toBe(false)
    expect(validateItemData({ due: '10/10/2026' }, fields).ok).toBe(false)
    expect(validateItemData({ tier: 'c' }, fields).ok).toBe(false)
    expect(validateItemData({ done: 'yes' }, fields).ok).toBe(false)
  })

  it('allows free-text select when options empty', () => {
    const freeSelect = [baseField({ key: 'tag', type: 'select', options: [] })]
    expect(validateItemData({ tag: 'anything' }, freeSelect).ok).toBe(true)
  })

  it('validates entity fields as UUIDs', () => {
    const entityField = [
      baseField({ key: 'client_ref', type: 'entity', entityKind: 'client' }),
    ]
    expect(
      validateItemData(
        { client_ref: '00000000-0000-4000-8000-000000000099' },
        entityField
      ).ok
    ).toBe(true)
    expect(validateItemData({ client_ref: 'not-a-uuid' }, entityField).ok).toBe(false)
  })
})
