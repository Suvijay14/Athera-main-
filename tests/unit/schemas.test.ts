import { describe, expect, it } from 'vitest'

import {
  createFieldInputSchema,
  createWorkItemInputSchema,
  fieldKeySchema,
} from '@/lib/db/schemas'

describe('fieldKeySchema', () => {
  it('accepts valid keys', () => {
    expect(fieldKeySchema.parse('status_code')).toBe('status_code')
  })

  it('rejects reserved keys', () => {
    expect(() => fieldKeySchema.parse('title')).toThrow()
    expect(() => fieldKeySchema.parse('notes')).toThrow()
  })

  it('rejects invalid format', () => {
    expect(() => fieldKeySchema.parse('Client')).toThrow()
    expect(() => fieldKeySchema.parse('1bad')).toThrow()
  })
})

describe('createFieldInputSchema', () => {
  it('requires label and source', () => {
    const parsed = createFieldInputSchema.parse({
      key: 'priority',
      label: 'Priority',
      type: 'select',
      source: 'user',
    })
    expect(parsed.options).toEqual([])
  })
})

describe('createWorkItemInputSchema', () => {
  it('rejects blank titles', () => {
    expect(() => createWorkItemInputSchema.parse({ title: '   ' })).toThrow()
  })
})
