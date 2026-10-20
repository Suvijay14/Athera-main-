import { describe, expect, it } from 'vitest'

import { parsePasteWeekLines } from '@/lib/workspace/paste-week'

const now = new Date('2026-03-15T12:00:00.000Z')

describe('parsePasteWeekLines', () => {
  it('skips empty lines and parses dates per line', () => {
    const rows = parsePasteWeekLines(
      'Follow up Dana Kim\n\nDentist Tue 3pm\n   \nInvoice only',
      now
    )
    expect(rows).toHaveLength(3)
    expect(rows[0]?.title).toBe('Follow up Dana Kim')
    expect(rows[1]?.startAt).toBeTruthy()
    expect(rows[2]?.title).toBe('Invoice only')
  })

  it('returns empty for whitespace-only input', () => {
    expect(parsePasteWeekLines('\n\n  \n', now)).toEqual([])
  })
})
