import { describe, expect, it } from 'vitest'

import { entityDisplayColor, spaceDisplayColor } from '@/lib/workspace/space-display-color'

describe('space-display-color', () => {
  it('prefers space color over entity color', () => {
    expect(
      entityDisplayColor({ color: '#111111' }, { color: '#22cc88' })
    ).toBe('#22cc88')
  })

  it('falls back when space has no color', () => {
    expect(spaceDisplayColor({ color: null })).toBe('#6366f1')
  })
})
