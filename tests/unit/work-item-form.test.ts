import { describe, expect, it } from 'vitest'

import type { FieldDefinition } from '@/lib/db/schemas'
import { validateWorkItemForm } from '@/lib/workspace/form-payload'

const field = (overrides: Partial<FieldDefinition>): FieldDefinition => ({
  id: '00000000-0000-4000-8000-000000000001',
  workspaceId: '00000000-0000-4000-8000-000000000099',
  key: 'priority',
  label: 'Priority',
  type: 'select',
  options: ['low', 'high'],
  entityKind: null,
  visible: true,
  position: 0,
  source: 'user',
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

describe('validateWorkItemForm', () => {
  it('blocks empty title', () => {
    const result = validateWorkItemForm([], {
      title: '   ',
      dueDate: null,
      notes: null,
      data: {},
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.titleError).toBeTruthy()
    }
  })

  it('shows inline field errors for invalid select value', () => {
    const result = validateWorkItemForm([field({})], {
      title: 'Valid title',
      dueDate: null,
      notes: null,
      data: { priority: 'invalid' },
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.fieldErrors.some((e) => e.key === 'priority')).toBe(true)
    }
  })

  it('returns normalized payload on success', () => {
    const result = validateWorkItemForm([field({})], {
      title: '  My job  ',
      dueDate: '2026-10-10',
      notes: null,
      data: { priority: 'low' },
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.payload.title).toBe('My job')
      expect(result.payload.data.priority).toBe('low')
    }
  })
})
