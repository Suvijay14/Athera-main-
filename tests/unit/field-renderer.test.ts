import { describe, expect, it } from 'vitest'

import type { FieldDefinition } from '@/lib/db/schemas'
import {
  formatFieldReadDisplay,
  isEmptyFieldValue,
} from '@/lib/workspace/field-read-display'

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

describe('field read display', () => {
  it('treats null/undefined/empty as empty', () => {
    expect(isEmptyFieldValue(null)).toBe(true)
    expect(isEmptyFieldValue(undefined)).toBe(true)
    expect(isEmptyFieldValue('')).toBe(true)
    expect(isEmptyFieldValue('x')).toBe(false)
  })

  it('formats each type for read mode', () => {
    expect(formatFieldReadDisplay(baseField({ type: 'text' }), null)).toBe('—')
    expect(formatFieldReadDisplay(baseField({ type: 'text' }), 'Hi')).toBe('Hi')
    expect(formatFieldReadDisplay(baseField({ type: 'number' }), 42)).toBe('42')
    expect(formatFieldReadDisplay(baseField({ type: 'date' }), '2026-10-15')).toContain('Oct')
    expect(formatFieldReadDisplay(baseField({ type: 'select' }), 'A')).toBe('A')
    expect(formatFieldReadDisplay(baseField({ type: 'checkbox' }), true)).toBe('✓')
    expect(formatFieldReadDisplay(baseField({ type: 'checkbox' }), false)).toBe('—')
  })
})
