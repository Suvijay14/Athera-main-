import { describe, expect, it } from 'vitest'

import {
  repeatPatternHeadline,
  repeatPatternReasoningLine,
} from '@/lib/adaptation/repeat-suggestion-copy'

describe('repeat-suggestion-copy', () => {
  it('matches demo-style headline and reasoning', () => {
    expect(repeatPatternHeadline('Lumen Health weekly update', [5], '4pm')).toBe(
      'Lumen Health weekly update is every Friday at 4pm. Make it repeat?'
    )
    expect(repeatPatternReasoningLine(3, [5])).toBe(
      "You've added it by hand 3 Fridays in a row."
    )
  })
})
