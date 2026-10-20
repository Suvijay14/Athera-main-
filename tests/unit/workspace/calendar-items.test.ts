import { describe, expect, it } from 'vitest'

import type { WorkItem } from '@/lib/db/schemas'
import { bucketCalendarItems, isUnscheduledItem } from '@/lib/workspace/calendar-items'

const spaceId = '00000000-0000-4000-8000-000000000010'
const ws = '00000000-0000-4000-8000-000000000099'

function item(partial: Partial<WorkItem> & Pick<WorkItem, 'id' | 'title'>): WorkItem {
  return {
    id: partial.id,
    workspaceId: ws,
    spaceId,
    title: partial.title,
    dueDate: partial.dueDate ?? null,
    notes: null,
    data: partial.data ?? {},
    startAt: partial.startAt ?? null,
    endAt: partial.endAt ?? null,
    allDay: partial.allDay ?? false,
    source: 'manual',
    spaceConfidence: null,
    archivedAt: null,
    completedAt: null,
    recurrenceId: null,
    recurrenceInstanceDate: null,
    externalProvider: null,
    externalId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

describe('calendar-items', () => {
  const range = {
    start: new Date('2026-03-02T00:00:00.000Z'),
    end: new Date('2026-03-08T23:59:59.999Z'),
  }

  it('puts undated items in unscheduled only', () => {
    const buckets = bucketCalendarItems([item({ id: '1', title: 'No date' })], range)
    expect(buckets.unscheduled).toHaveLength(1)
    expect(buckets.timed).toHaveLength(0)
    expect(buckets.allDay).toHaveLength(0)
  })

  it('buckets timed items overlapping range', () => {
    const buckets = bucketCalendarItems(
      [
        item({
          id: 't1',
          title: 'Meeting',
          startAt: '2026-03-03T15:00:00.000Z',
          endAt: '2026-03-03T16:00:00.000Z',
        }),
      ],
      range
    )
    expect(buckets.timed).toHaveLength(1)
    expect(buckets.timed[0]?.item.id).toBe('t1')
  })

  it('buckets due_date-only as all-day', () => {
    const buckets = bucketCalendarItems(
      [item({ id: 'd1', title: 'Due', dueDate: '2026-03-04' })],
      range
    )
    expect(buckets.allDay).toHaveLength(1)
    expect(buckets.timed).toHaveLength(0)
  })

  it('excludes timed items outside range', () => {
    const buckets = bucketCalendarItems(
      [
        item({
          id: 'out',
          title: 'Later',
          startAt: '2026-03-20T10:00:00.000Z',
          endAt: '2026-03-20T11:00:00.000Z',
        }),
      ],
      range
    )
    expect(buckets.timed).toHaveLength(0)
  })

  it('isUnscheduledItem is true without start or due', () => {
    expect(isUnscheduledItem(item({ id: 'u', title: 'x' }))).toBe(true)
    expect(isUnscheduledItem(item({ id: 'd', title: 'x', dueDate: '2026-03-01' }))).toBe(false)
  })
})
