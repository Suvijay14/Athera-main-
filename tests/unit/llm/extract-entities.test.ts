import { beforeEach, describe, expect, it, vi } from 'vitest'

const extractJSON = vi.fn()
const getCachedLlmResponse = vi.fn()
const setCachedLlmResponse = vi.fn()

vi.mock('@/lib/llm/client', () => ({
  extractJSON: (...args: unknown[]) => extractJSON(...args),
  llmCacheKey: () => 'cache-key-fixed',
}))

vi.mock('@/lib/db/llm-cache', () => ({
  getCachedLlmResponse: (...args: unknown[]) => getCachedLlmResponse(...args),
  setCachedLlmResponse: (...args: unknown[]) => setCachedLlmResponse(...args),
}))

describe('extractEntitiesFromTitle', () => {
  beforeEach(() => {
    extractJSON.mockReset()
    getCachedLlmResponse.mockReset()
    setCachedLlmResponse.mockReset()
    getCachedLlmResponse.mockResolvedValue(null)
    setCachedLlmResponse.mockResolvedValue(undefined)
  })

  it('uses cache when present', async () => {
    getCachedLlmResponse.mockResolvedValue({
      entities: [
        {
          name: 'Rivera Plumbing',
          kind: 'client',
          matches_existing_id: null,
          confidence: 0.88,
        },
      ],
    })

    const { extractEntitiesFromTitle } = await import('@/lib/llm/extract-entities')
    const result = await extractEntitiesFromTitle('Call Rivera Plumbing', [])
    expect(result).toHaveLength(1)
    expect(result[0]?.name).toBe('Rivera Plumbing')
    expect(extractJSON).not.toHaveBeenCalled()
  })

  it('calls LLM and writes cache on miss', async () => {
    extractJSON.mockResolvedValue({
      entities: [
        {
          name: 'Dana Kim',
          kind: 'client',
          matches_existing_id: '00000000-0000-4000-8000-000000000001',
          confidence: 0.92,
        },
      ],
    })

    const { extractEntitiesFromTitle } = await import('@/lib/llm/extract-entities')
    const result = await extractEntitiesFromTitle('Dana Kim follow-up', [
      {
        id: '00000000-0000-4000-8000-000000000001',
        name: 'Dana Kim',
        kind: 'client',
        aliases: [],
      },
    ])
    expect(result[0]?.matches_existing_id).toBe('00000000-0000-4000-8000-000000000001')
    expect(extractJSON).toHaveBeenCalledOnce()
    expect(setCachedLlmResponse).toHaveBeenCalledOnce()
  })
})
