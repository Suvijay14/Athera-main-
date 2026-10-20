import { describe, expect, it } from 'vitest'

import { GOOGLE_CALENDAR_PROVIDER } from '@/lib/integrations/google-calendar/constants'
import {
  mapGoogleCalendarEventToImportItem,
  partitionCalendarImportItems,
} from '@/lib/integrations/google-calendar/map-event'

describe('mapGoogleCalendarEventToImportItem', () => {
  it('maps timed events with start and end', () => {
    const mapped = mapGoogleCalendarEventToImportItem({
      id: 'evt1',
      summary: 'Team standup',
      start: { dateTime: '2026-10-10T15:00:00-07:00' },
      end: { dateTime: '2026-10-10T15:30:00-07:00' },
    })
    expect(mapped).toEqual({
      externalProvider: GOOGLE_CALENDAR_PROVIDER,
      externalId: 'evt1',
      title: 'Team standup',
      notes: null,
      startAt: '2026-10-10T15:00:00-07:00',
      endAt: '2026-10-10T15:30:00-07:00',
      dueDate: null,
      allDay: false,
      source: 'import',
    })
  })

  it('maps all-day events to due_date without start_at', () => {
    const mapped = mapGoogleCalendarEventToImportItem({
      id: 'evt2',
      summary: 'Holiday',
      start: { date: '2026-10-12' },
      end: { date: '2026-10-13' },
    })
    expect(mapped?.allDay).toBe(true)
    expect(mapped?.dueDate).toBe('2026-10-12')
    expect(mapped?.startAt).toBeNull()
  })

  it('uses fallback title when summary missing', () => {
    const mapped = mapGoogleCalendarEventToImportItem({
      id: 'evt3',
      start: { dateTime: '2026-10-10T10:00:00Z' },
    })
    expect(mapped?.title).toBe('(No title)')
  })

  it('returns null for cancelled events', () => {
    expect(
      mapGoogleCalendarEventToImportItem({
        id: 'evt4',
        status: 'cancelled',
        start: { dateTime: '2026-10-10T10:00:00Z' },
      })
    ).toBeNull()
  })

  it('returns null when id missing', () => {
    expect(
      mapGoogleCalendarEventToImportItem({
        summary: 'No id',
        start: { dateTime: '2026-10-10T10:00:00Z' },
      })
    ).toBeNull()
  })
})

describe('partitionCalendarImportItems', () => {
  const base = {
    externalProvider: GOOGLE_CALENDAR_PROVIDER,
    externalId: 'a',
    title: 'A',
    notes: null,
    startAt: '2026-10-10T10:00:00Z',
    endAt: null,
    dueDate: null,
    allDay: false,
    source: 'import' as const,
  }

  it('splits creates and updates by external id', () => {
    const mapped = [
      base,
      { ...base, externalId: 'b', title: 'B' },
      { ...base, externalId: 'a', title: 'A updated' },
    ]
    const { creates, updates } = partitionCalendarImportItems(mapped, [
      { externalId: 'a', itemId: 'item-uuid-a' },
    ])
    expect(creates).toHaveLength(1)
    expect(creates[0]?.externalId).toBe('b')
    expect(updates).toHaveLength(1)
    expect(updates[0]?.itemId).toBe('item-uuid-a')
    expect(updates[0]?.patch.title).toBe('A updated')
  })

  it('treats full re-import as all creates when nothing exists', () => {
    const { creates, updates } = partitionCalendarImportItems([base], [])
    expect(creates).toHaveLength(1)
    expect(updates).toHaveLength(0)
  })
})
