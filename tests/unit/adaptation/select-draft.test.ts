import { describe, expect, it } from 'vitest'

import type { SuggestionDraft } from '@/lib/adaptation/detector-types'
import { selectDraftForPersistence } from '@/lib/adaptation/select-draft'
import { makeSuggestion } from '../detectors/fixtures'

describe('selectDraftForPersistence', () => {
  const high: SuggestionDraft = {
    type: 'repeated-entity',
    reason: 'high',
    evidence: {},
    confidence: 0.9,
    dedupeKey: 'repeated-entity:client',
    operations: [],
  }
  const low: SuggestionDraft = {
    type: 'status-in-notes',
    reason: 'low',
    evidence: {},
    confidence: 0.7,
    dedupeKey: 'status-in-notes',
    operations: [],
  }

  it('keeps the highest-confidence draft when both qualify', () => {
    expect(selectDraftForPersistence([high, low], [])).toEqual(high)
  })

  it('keeps the first draft on equal confidence', () => {
    const tie: SuggestionDraft = { ...low, confidence: 0.9, dedupeKey: 'status-in-notes' }
    expect(selectDraftForPersistence([high, tie], [])).toEqual(high)
  })

  it('filters drafts blocked by recent suggestions', () => {
    const recent = [makeSuggestion({ dedupeKey: 'repeated-entity:client' })]
    expect(selectDraftForPersistence([high, low], recent)).toEqual(low)
  })
})
