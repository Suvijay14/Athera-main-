import { addDays, format } from 'date-fns'
import { describe, expect, it } from 'vitest'

import { detectRepeat } from '@/lib/adaptation/detectors/detect-repeat'
import { baseContext, makeItem } from './fixtures'

const SPACE = '00000000-0000-4000-8000-000000000010'

function tuesdaySeries(count: number, start: Date): ReturnType<typeof makeItem>[] {
  const items: ReturnType<typeof makeItem>[] = []
  for (let i = 0; i < count; i++) {
    const d = addDays(start, i * 7)
    items.push(
      makeItem({
        id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
        spaceId: SPACE,
        title: 'Team sync',
        dueDate: format(d, 'yyyy-MM-dd'),
        createdAt: d.toISOString(),
      })
    )
  }
  return items
}

describe('detectRepeat', () => {
  const now = new Date('2026-03-17T12:00:00.000Z')

  it('fires on weekly same-weekday pattern with 3+ items', () => {
    const items = tuesdaySeries(3, new Date('2026-03-03T12:00:00.000Z'))
    const draft = detectRepeat(baseContext({ items, now }))
    expect(draft).not.toBeNull()
    expect(draft!.confidence).toBe(0.8)
    expect(draft!.operations[0]?.op).toBe('create_recurrence_rule')
    expect(draft!.evidence.projectedDates).toHaveLength(4)
  })

  it('confidence 0.9 at 4 items', () => {
    const items = tuesdaySeries(4, new Date('2026-02-24T12:00:00.000Z'))
    const draft = detectRepeat(baseContext({ items, now }))
    expect(draft?.confidence).toBe(0.9)
  })

  it('confidence 0.95 at 5+ items', () => {
    const items = tuesdaySeries(5, new Date('2026-02-17T12:00:00.000Z'))
    const draft = detectRepeat(baseContext({ items, now }))
    expect(draft?.confidence).toBe(0.95)
  })

  it('ignores imported items', () => {
    const items = tuesdaySeries(3, new Date('2026-03-03T12:00:00.000Z')).map((item) => ({
      ...item,
      source: 'import' as const,
    }))
    expect(detectRepeat(baseContext({ items, now }))).toBeNull()
  })

  it('silent when weekdays mismatch', () => {
    const items = [
      makeItem({ spaceId: SPACE, title: 'Team sync', dueDate: '2026-02-03' }),
      makeItem({ spaceId: SPACE, title: 'Team sync', dueDate: '2026-02-10' }),
      makeItem({ spaceId: SPACE, title: 'Team sync', dueDate: '2026-02-18' }),
    ]
    expect(detectRepeat(baseContext({ items, now }))).toBeNull()
  })

  it('silent when recurrence rule already covers title', () => {
    const items = tuesdaySeries(3, new Date('2026-02-24T12:00:00.000Z'))
    const draft = detectRepeat(
      baseContext({
        items,
        now,
        recurrenceRules: [
          {
            id: '00000000-0000-4000-8000-000000000099',
            workspaceId: '00000000-0000-4000-8000-000000000001',
            spaceId: SPACE,
            templateItem: { title: 'Team sync' },
            freq: 'weekly',
            intervalCount: 1,
            byWeekday: [2],
            timeOfDay: null,
            durationMin: null,
            startsOn: '2026-01-01',
            endsOn: null,
            exceptions: [],
            active: true,
            source: 'athera',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      })
    )
    expect(draft).toBeNull()
  })
})
