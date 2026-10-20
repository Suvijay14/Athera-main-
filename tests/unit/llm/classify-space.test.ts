import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/lib/llm/client', () => ({
  extractJSON: vi.fn(),
  llmCacheKey: vi.fn(() => 'cache-key'),
}))

vi.mock('@/lib/db/llm-cache', () => ({
  getCachedLlmResponse: vi.fn(async () => null),
  setCachedLlmResponse: vi.fn(async () => {}),
}))

import { extractJSON } from '@/lib/llm/client'
import { classifyItemSpace, SPACE_CLASSIFICATION_SYSTEM } from '@/lib/llm/classify-space'

const spaceA = '00000000-0000-4000-8000-000000000010'

describe('classifyItemSpace', () => {
  beforeEach(() => {
    vi.mocked(extractJSON).mockReset()
  })

  it('returns high-confidence classification from Groq', async () => {
    vi.mocked(extractJSON).mockResolvedValue({ space_id: spaceA, confidence: 0.92 })
    const result = await classifyItemSpace(
      'Maya algebra Tuesday',
      [{ id: spaceA, name: 'Tutoring', recentTitles: ['Maya algebra'] }],
      [],
      { useCache: false }
    )
    expect(result.confidence).toBeGreaterThanOrEqual(0.8)
    expect(result.space_id).toBe(spaceA)
  })

  it('includes corrections in the user prompt', async () => {
    vi.mocked(extractJSON).mockImplementation(async (_sys, userPrompt) => {
      expect(userPrompt).toContain('"dentist"')
      return { space_id: spaceA, confidence: 0.4 }
    })
    await classifyItemSpace(
      'random errand',
      [{ id: spaceA, name: 'Personal', recentTitles: [] }],
      [{ title: 'dentist', toSpaceId: spaceA }],
      { useCache: false }
    )
    expect(extractJSON).toHaveBeenCalledWith(
      SPACE_CLASSIFICATION_SYSTEM,
      expect.stringContaining('dentist'),
      expect.anything(),
      'classify_space'
    )
  })
})
