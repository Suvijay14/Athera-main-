import { describe, expect, it } from 'vitest'

import { entityHasActiveRecurrence } from '@/lib/workspace/recurrence-entity'
import { makeItem } from '@/tests/unit/detectors/fixtures'

describe('entityHasActiveRecurrence', () => {
  const entityId = '00000000-0000-4000-8000-000000000020'
  const ruleId = '00000000-0000-4000-8000-000000000099'

  it('true when linked item has active recurrence', () => {
    const items = [
      makeItem({
        title: 'Lesson',
        data: { client: entityId },
        recurrenceId: ruleId,
      }),
    ]
    const rules = [
      {
        id: ruleId,
        workspaceId: 'w',
        spaceId: 's',
        templateItem: { title: 'Lesson' },
        freq: 'weekly' as const,
        intervalCount: 1 as const,
        byWeekday: [2],
        timeOfDay: null,
        durationMin: null,
        startsOn: '2026-01-01',
        endsOn: null,
        exceptions: [],
        active: true,
        source: 'athera' as const,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]
    expect(entityHasActiveRecurrence(entityId, items, rules, ['client'])).toBe(true)
  })
})
