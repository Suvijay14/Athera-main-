import { describe, expect, it } from 'vitest'

import { formatWorkItemDueCell } from '@/lib/workspace/format-item-datetime'

describe('formatWorkItemDueCell', () => {
  it('formats startAt with fixed display timezone (UTC default)', () => {
    const text = formatWorkItemDueCell(null, '2026-10-15T21:00:00.000Z')
    expect(text).toBe('Oct 15, 9:00 PM')
  })

  it('formats date-only due dates without timezone day shift', () => {
    expect(formatWorkItemDueCell('2026-10-15', null)).toBe('Oct 15, 2026')
  })

  it('matches server and client when TZ env is unset (UTC)', () => {
    const a = formatWorkItemDueCell(null, '2026-03-10T16:00:00.000Z')
    const b = formatWorkItemDueCell(null, '2026-03-10T16:00:00.000Z')
    expect(a).toBe(b)
    expect(a).toContain('Mar 10')
  })
})
