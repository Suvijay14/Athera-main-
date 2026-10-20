import { describe, expect, it } from 'vitest'

import { tryDeterministicViewRequest } from '@/lib/llm/parse-view-request'

const ctx = {
  spaceId: '00000000-0000-4000-8000-000000000010',
  spaceName: 'Test',
  fields: [],
  entities: [],
  todayIso: '2026-03-01',
  timezone: 'UTC',
}

describe('tryDeterministicViewRequest', () => {
  it('parses calendar week without LLM', () => {
    const spec = tryDeterministicViewRequest('save a calendar view for this week', ctx)
    expect(spec).toMatchObject({ type: 'calendar', range: 'week', save: true })
  })

  it('returns null for unrelated text', () => {
    expect(tryDeterministicViewRequest('make me a sandwich', ctx)).toBeNull()
  })
})
