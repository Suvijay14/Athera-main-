import { describe, expect, it } from 'vitest'

import { formatMetricRate } from '@/lib/db/metrics'

describe('formatMetricRate', () => {
  it('returns em dash when denominator is zero', () => {
    expect(formatMetricRate(1, 0)).toBe('—')
    expect(formatMetricRate(0, 0)).toBe('—')
  })

  it('formats percentage with one decimal', () => {
    expect(formatMetricRate(1, 4)).toBe('25%')
    expect(formatMetricRate(3, 4)).toBe('75%')
  })
})
