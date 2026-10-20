import { describe, expect, it } from 'vitest'

import { shouldMarkSuggestionShown } from '@/lib/adaptation/suggestion-ui'

describe('shouldMarkSuggestionShown', () => {
  it('returns true only for pending', () => {
    expect(shouldMarkSuggestionShown('pending')).toBe(true)
    expect(shouldMarkSuggestionShown('shown')).toBe(false)
    expect(shouldMarkSuggestionShown('accepted')).toBe(false)
  })
})
