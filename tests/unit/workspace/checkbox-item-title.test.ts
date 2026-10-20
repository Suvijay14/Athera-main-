import { describe, expect, it } from 'vitest'

import { checkboxLineToCreatePayload, normalizeCheckboxLineText } from '@/lib/workspace/notes/checkbox-item-title'

describe('checkbox item title', () => {
  it('strips checkbox markers and parses friday date', () => {
    expect(normalizeCheckboxLineText('[] call supplier friday')).toBe('call supplier friday')
    const payload = checkboxLineToCreatePayload('[] call supplier friday', new Date('2026-10-14T12:00:00'))
    expect(payload?.title).toBeTruthy()
    expect(payload?.dueDate ?? payload?.startAt).toBeTruthy()
  })

  it('creates undated payload for plain text', () => {
    const payload = checkboxLineToCreatePayload('send revised mockups')
    expect(payload?.title).toBe('send revised mockups')
    expect(payload?.dueDate).toBeUndefined()
  })
})
