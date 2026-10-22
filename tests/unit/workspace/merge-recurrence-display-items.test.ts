import { addWeeks, format, nextFriday } from 'date-fns'
import { describe, expect, it } from 'vitest'

import type { RecurrenceRule, WorkItem } from '@/lib/db/schemas'
import { mergeWorkItemsWithRecurrenceInstances } from '@/lib/workspace/merge-recurrence-display-items'

const workspaceId = '00000000-0000-4000-8000-000000000099'
const spaceId = '00000000-0000-4000-8000-000000000010'
const ruleId = '00000000-0000-4000-8000-000000000020'

function item(partial: Partial<WorkItem> & Pick<WorkItem, 'id' | 'title'>): WorkItem {
  return {
    workspaceId,
    spaceId,
    dueDate: null,
    notes: null,
    data: {},
    startAt: null,
    endAt: null,
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
    ...partial,
  }
}

describe('mergeWorkItemsWithRecurrenceInstances', () => {
  it('adds virtual next Friday after a linked manual occurrence', () => {
    const now = new Date('2026-10-21T12:00:00.000Z')
    const thisFriday = format(nextFriday(now), 'yyyy-MM-dd')
    const nextFri = format(addWeeks(nextFriday(now), 1), 'yyyy-MM-dd')

    const stored = [
      item({
        id: '00000000-0000-4000-8000-000000000001',
        title: 'Weekly update',
        startAt: `${thisFriday}T16:00:00.000Z`,
        recurrenceId: ruleId,
        recurrenceInstanceDate: thisFriday,
      }),
    ]

    const rule: RecurrenceRule = {
      id: ruleId,
      workspaceId,
      spaceId,
      templateItem: { title: 'Weekly update', data: {} },
      freq: 'weekly',
      intervalCount: 1,
      byWeekday: [5],
      timeOfDay: '16:00',
      durationMin: null,
      startsOn: thisFriday,
      endsOn: null,
      exceptions: [],
      active: true,
      source: 'athera',
      createdAt: '2026-01-01T00:00:00.000Z',
    }

    const merged = mergeWorkItemsWithRecurrenceInstances(
      workspaceId,
      stored,
      [rule],
      now,
      addWeeks(now, 8),
      now
    )

    const virtualNext = merged.find(
      (i) => i.isVirtualRecurrence && i.recurrenceInstanceDate === nextFri
    )
    expect(virtualNext).toBeDefined()
    expect(virtualNext?.title).toBe('Weekly update')
    expect(virtualNext?.startAt).toBeTruthy()
  })
})
