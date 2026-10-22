import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { SuggestionDraft } from '@/lib/adaptation/detector-types'
import { runAllDetectors } from '@/lib/adaptation/detectors'
import { selectDraftForPersistence } from '@/lib/adaptation/select-draft'
import { insertPendingSuggestion } from '@/lib/db/suggestions'
import type { Suggestion } from '@/lib/db/schemas'

vi.mock('@/lib/adaptation/detectors', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/adaptation/detectors')>()
  return { ...actual, runAllDetectors: vi.fn() }
})

vi.mock('@/lib/db/fields', () => ({ listFields: vi.fn().mockResolvedValue([]) }))
vi.mock('@/lib/db/items', () => ({
  listItems: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
}))
vi.mock('@/lib/db/spaces', () => ({
  listSpaces: vi.fn().mockResolvedValue([]),
}))
vi.mock('@/lib/db/views', () => ({ listViews: vi.fn().mockResolvedValue([]) }))
vi.mock('@/lib/db/recurrence-rules', () => ({
  listRecurrenceRules: vi.fn().mockResolvedValue([]),
}))
vi.mock('@/lib/db/item-entity-extractions', () => ({
  listExtractionsForWorkspaceSince: vi.fn().mockResolvedValue([]),
}))
vi.mock('@/lib/db/suggestions', () => ({
  listRecentSuggestionsForDetection: vi.fn().mockResolvedValue([]),
  insertPendingSuggestion: vi.fn(),
}))

describe('runAdaptation persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('persists only the higher-confidence draft when two detectors fire', async () => {
    const repeated: SuggestionDraft = {
      type: 'repeated-entity',
      reason: 'high',
      evidence: {},
      confidence: 0.85,
      dedupeKey: 'repeated-entity:client',
      operations: [],
    }
    const status: SuggestionDraft = {
      type: 'status-in-notes',
      reason: 'low',
      evidence: {},
      confidence: 0.7,
      dedupeKey: 'status-in-notes',
      operations: [],
    }
    vi.mocked(runAllDetectors).mockReturnValue([repeated, status])

    const chosen = selectDraftForPersistence([repeated, status], [])
    expect(chosen).toEqual(repeated)

    const inserted: Suggestion = {
      id: '00000000-0000-4000-8000-000000000001',
      workspaceId: '00000000-0000-4000-8000-000000000002',
      type: repeated.type,
      status: 'pending',
      reason: repeated.reason,
      evidence: {},
      confidence: repeated.confidence,
      operations: [],
      dedupeKey: repeated.dedupeKey,
      createdAt: '2026-01-01T00:00:00.000Z',
      resolvedAt: null,
    }
    vi.mocked(insertPendingSuggestion)
      .mockResolvedValueOnce(inserted)
      .mockResolvedValueOnce(null)

    const { runAdaptation } = await import('@/lib/adaptation/engine')
    const client = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({
                data: { created_at: '2026-01-01T00:00:00.000Z' },
                error: null,
              }),
          }),
        }),
      }),
    } as never
    const ws = inserted.workspaceId

    const first = await runAdaptation(client, ws)
    const second = await runAdaptation(client, ws)

    expect(first?.dedupeKey).toBe('repeated-entity:client')
    expect(second).toBeNull()
    expect(insertPendingSuggestion).toHaveBeenCalledTimes(2)
    expect(insertPendingSuggestion).toHaveBeenNthCalledWith(1, client, ws, repeated)
  })
})
