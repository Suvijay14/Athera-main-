import { describe, expect, it } from 'vitest'

import type { WorkItem } from '@/lib/db/schemas'
import {
  patchForMoveTimedItem,
  patchForScheduleFromTray,
} from '@/lib/workspace/calendar-drag'

const base: WorkItem = {
  id: '1',
  workspaceId: 'w',
  spaceId: 's',
  title: 'Test',
  dueDate: null,
  notes: null,
  data: {},
  startAt: '2026-03-03T14:00:00.000Z',
  endAt: '2026-03-03T15:00:00.000Z',
  allDay: false,
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

describe('calendar-drag', () => {
  it('preserves duration when moving timed item', () => {
    const day = new Date('2026-03-05T00:00:00.000Z')
    const patch = patchForMoveTimedItem(base, { mode: 'timed', day, hour: 10 })
    expect(patch.dueDate).toBeNull()
    expect(patch.startAt).toBeTruthy()
    expect(patch.endAt).toBeTruthy()
    const start = new Date(patch.startAt!).getTime()
    const end = new Date(patch.endAt!).getTime()
    expect(end - start).toBe(60 * 60 * 1000)
  })

  it('sets due_date when scheduling from tray to all-day', () => {
    const day = new Date('2026-03-06T12:00:00.000Z')
    const patch = patchForScheduleFromTray({ ...base, startAt: null, endAt: null }, { mode: 'all-day', day })
    expect(patch.dueDate).toBe('2026-03-06')
    expect(patch.startAt).toBeNull()
  })
})
