import { describe, expect, it } from 'vitest'

import type { SuggestionDraft } from '@/lib/adaptation/detector-types'
import { insertPendingSuggestion } from '@/lib/db/suggestions'

describe('insertPendingSuggestion', () => {
  it('returns null on active dedupe unique violation', async () => {
    const draft: SuggestionDraft = {
      type: 'repeated-entity',
      reason: 'test',
      evidence: {},
      confidence: 0.8,
      dedupeKey: 'repeated-entity:client',
      operations: [],
    }

    const client = {
      from: () => ({
        insert: () => ({
          select: () => ({
            single: async () => ({
              data: null,
              error: { code: '23505', message: 'duplicate key' },
            }),
          }),
        }),
      }),
    }

    const result = await insertPendingSuggestion(client as never, '00000000-0000-4000-8000-000000000099', draft)
    expect(result).toBeNull()
  })
})
