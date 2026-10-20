import { describe, expect, it } from 'vitest'

import { computeLearningStage } from '@/lib/workspace/learning-stage'

describe('computeLearningStage', () => {
  it('stage 1 below 10 items', () => {
    expect(computeLearningStage(9, 0).stage).toBe(1)
    expect(computeLearningStage(9, 5).label).toBe('Getting to know you')
  })

  it('stage 2 at 10+ items with fewer than 2 active adaptations', () => {
    const info = computeLearningStage(25, 1)
    expect(info.stage).toBe(2)
    expect(info.label).toBe('Learning your patterns')
  })

  it('stage 3 at 10+ items with 2+ active adaptations', () => {
    const info = computeLearningStage(25, 2)
    expect(info.stage).toBe(3)
    expect(info.label).toBe('Tailored to you')
  })
})
