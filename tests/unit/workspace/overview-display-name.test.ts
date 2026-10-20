import { describe, expect, it } from 'vitest'

import { displayNameFromEmail } from '@/lib/workspace/overview-display-name'

describe('displayNameFromEmail', () => {
  it('uses segment before @ and capitalizes', () => {
    expect(displayNameFromEmail('maya@example.com')).toBe('Maya')
    expect(displayNameFromEmail('rivera.bakery@co.com')).toBe('Rivera')
  })

  it('falls back to there', () => {
    expect(displayNameFromEmail(undefined)).toBe('there')
    expect(displayNameFromEmail('')).toBe('there')
  })
})
