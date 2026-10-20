import { beforeEach, describe, expect, it, vi } from 'vitest'

const extractJSON = vi.fn()

vi.mock('@/lib/llm/client', () => ({
  extractJSON: (...args: unknown[]) => extractJSON(...args),
  llmCacheKey: () => 'k',
}))

vi.mock('@/lib/db/llm-cache', () => ({
  getCachedLlmResponse: vi.fn().mockResolvedValue(null),
  setCachedLlmResponse: vi.fn().mockResolvedValue(undefined),
}))

describe('draftCheckinMessage', () => {
  beforeEach(() => {
    extractJSON.mockReset()
    extractJSON.mockResolvedValue({ body: 'Hi Max, it has been a few weeks — want to schedule something?' })
  })

  it('returns LLM body', async () => {
    const { draftCheckinMessage } = await import('@/lib/llm/draft-checkin')
    const body = await draftCheckinMessage({
      entityName: 'Max Kim',
      entityKind: 'student',
      weeksSinceLastActivity: 4,
      cadenceLabel: 'weekly',
      recentItems: [{ title: 'Algebra session', dateLabel: 'Feb 1' }],
    })
    expect(body).toContain('Max')
    expect(extractJSON).toHaveBeenCalled()
  })
})
