import { beforeEach, describe, expect, it, vi } from 'vitest'

const extractJSON = vi.fn()
const getCachedLlmResponse = vi.fn()
const setCachedLlmResponse = vi.fn()

vi.mock('@/lib/llm/client', () => ({
  extractJSON: (...args: unknown[]) => extractJSON(...args),
  llmCacheKey: () => 'cache-key',
}))

vi.mock('@/lib/db/llm-cache', () => ({
  getCachedLlmResponse: (...args: unknown[]) => getCachedLlmResponse(...args),
  setCachedLlmResponse: (...args: unknown[]) => setCachedLlmResponse(...args),
}))

const ctx = {
  spaceId: '00000000-0000-4000-8000-000000000010',
  spaceName: 'Test Space',
  fields: [
    {
      id: 'f1',
      workspaceId: 'w',
      key: 'client',
      label: 'Client',
      type: 'entity' as const,
      options: [],
      entityKind: 'client',
      visible: true,
      position: 0,
      source: 'athera' as const,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  entities: [
    {
      id: '00000000-0000-4000-8000-000000000001',
      workspaceId: 'w',
      spaceId: '00000000-0000-4000-8000-000000000010',
      kind: 'client',
      name: 'Acme Corp',
      aliases: [],
      color: '#6366f1',
      archivedAt: null,
      lastActivityAt: null,
      typicalGapDays: null,
      excludedFromSuggestions: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  todayIso: '2026-03-01',
  timezone: 'America/Los_Angeles',
}

describe('parseViewRequestFromText', () => {
  beforeEach(() => {
    extractJSON.mockReset()
    getCachedLlmResponse.mockReset()
    setCachedLlmResponse.mockReset()
    getCachedLlmResponse.mockResolvedValue(null)
    setCachedLlmResponse.mockResolvedValue(undefined)
  })

  it('returns validated calendar spec from LLM', async () => {
    extractJSON.mockResolvedValue({
      type: 'calendar',
      range: 'week',
      group_by: null,
      color_by: null,
      save: true,
      filters: [],
    })
    const { parseViewRequestFromText } = await import('@/lib/llm/parse-view-request')
    const spec = await parseViewRequestFromText('show this week as a calendar', ctx)
    expect('unsupported' in spec).toBe(false)
    if (!('unsupported' in spec)) {
      expect(spec.type).toBe('calendar')
      expect(spec.range).toBe('week')
    }
  })

  it('returns unsupported when LLM marks unsupported', async () => {
    extractJSON.mockResolvedValue({ unsupported: true })
    const { parseViewRequestFromText } = await import('@/lib/llm/parse-view-request')
    const spec = await parseViewRequestFromText('make me a sandwich', ctx)
    expect(spec).toEqual({ unsupported: true })
  })

  it('rejects hallucinated filter field', async () => {
    extractJSON.mockResolvedValue({
      type: 'list',
      range: null,
      group_by: null,
      color_by: null,
      save: true,
      filters: [{ field: 'fake_field', op: 'is', value: 'x' }],
    })
    const { parseViewRequestFromText } = await import('@/lib/llm/parse-view-request')
    const spec = await parseViewRequestFromText('only fake', ctx)
    expect(spec).toEqual({ unsupported: true })
  })
})

describe('validateLlmViewRequest', () => {
  it('rejects unknown entity in filter value', async () => {
    const { validateLlmViewRequest } = await import('@/lib/llm/parse-view-request')
    const spec = validateLlmViewRequest(
      {
        type: 'list',
        range: null,
        group_by: null,
        color_by: null,
        save: true,
        filters: [{ field: 'client', op: 'is', value: 'Not Real Co' }],
      },
      ctx
    )
    expect(spec).toEqual({ unsupported: true })
  })
})
