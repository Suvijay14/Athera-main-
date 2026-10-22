import { describe, expect, it } from 'vitest'

import { inferTaskRowIconKind } from '@/lib/workspace/infer-task-row-icon'

describe('inferTaskRowIconKind', () => {
  it('classifies calls and deliverables from title', () => {
    expect(inferTaskRowIconKind('Call with Maria')).toBe('call')
    expect(inferTaskRowIconKind('Send revised mockups')).toBe('deliverable')
    expect(inferTaskRowIconKind('Groceries')).toBe('task')
  })
})
