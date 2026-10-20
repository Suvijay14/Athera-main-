import { describe, expect, it } from 'vitest'

import {
  CALENDAR_VIEW_MIN_DATED_RATE,
  CALENDAR_VIEW_MIN_ITEMS,
  detectCalendarView,
} from '@/lib/adaptation/detectors/detect-calendar-view'

import { baseContext, makeItem, makeSuggestion } from './fixtures'

const spaceId = '00000000-0000-4000-8000-000000000010'

function datedItems(count: number, withDate: number) {
  const items = Array.from({ length: count }, (_, i) =>
    makeItem({
      id: `i${i}`,
      title: `Item ${i}`,
      spaceId,
      dueDate: i < withDate ? '2026-03-01' : null,
    })
  )
  return items
}

describe('detectCalendarView', () => {
  it('fires when space has enough dated items and no calendar view', () => {
    const items = datedItems(CALENDAR_VIEW_MIN_ITEMS, Math.ceil(CALENDAR_VIEW_MIN_ITEMS * CALENDAR_VIEW_MIN_DATED_RATE))
    const draft = detectCalendarView(baseContext({ items, views: [] }))
    expect(draft).not.toBeNull()
    expect(draft!.type).toBe('calendar-view')
    expect(draft!.reason).toContain('dated')
    expect(draft!.operations[0]?.op).toBe('create_view')
  })

  it('is silent below item count threshold', () => {
    const items = datedItems(CALENDAR_VIEW_MIN_ITEMS - 1, CALENDAR_VIEW_MIN_ITEMS - 1)
    expect(detectCalendarView(baseContext({ items, views: [] }))).toBeNull()
  })

  it('is silent below dated percentage threshold', () => {
    const items = datedItems(CALENDAR_VIEW_MIN_ITEMS, 2)
    expect(detectCalendarView(baseContext({ items, views: [] }))).toBeNull()
  })

  it('is silent when calendar view exists', () => {
    const items = datedItems(10, 10)
    const views = [
      {
        id: '00000000-0000-4000-8000-000000000020',
        workspaceId: '00000000-0000-4000-8000-000000000099',
        name: 'Calendar',
        type: 'calendar' as const,
        groupByField: null,
        colorByField: null,
        calendarRange: 'week' as const,
        filters: {},
        visible: true,
        position: 0,
        source: 'user' as const,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]
    expect(detectCalendarView(baseContext({ items, views }))).toBeNull()
  })

  it('has stable dedupe key per space', () => {
    const items = datedItems(10, 10)
    const a = detectCalendarView(baseContext({ items, views: [] }))
    const b = detectCalendarView(baseContext({ items, views: [] }))
    expect(a!.dedupeKey).toBe(b!.dedupeKey)
    expect(a!.dedupeKey).toBe(`calendar-view:${spaceId}`)
  })

  it('is silent when dedupe blocked', () => {
    const items = datedItems(10, 10)
    const recent = [makeSuggestion({ dedupeKey: `calendar-view:${spaceId}` })]
    expect(detectCalendarView(baseContext({ items, views: [], recentSuggestions: recent }))).toBeNull()
  })
})
