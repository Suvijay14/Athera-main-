import { describe, expect, it } from 'vitest'

import { workItemsToDashboardTasks } from '@/lib/dashboard/from-workspace-items'
import type { WorkItem } from '@/lib/db/schemas'

function item(partial: Partial<WorkItem> & Pick<WorkItem, 'id' | 'title'>): WorkItem {
  return {
    workspaceId: '00000000-0000-4000-8000-000000000001',
    spaceId: '00000000-0000-4000-8000-000000000002',
    notes: null,
    data: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    dueDate: null,
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
    ...partial,
  }
}

describe('workItemsToDashboardTasks', () => {
  it('maps open items with due dates to tasks', () => {
    const now = new Date('2026-10-19T15:00:00.000Z')
    const tasks = workItemsToDashboardTasks(
      [
        item({
          id: '1',
          title: 'Invoice Rivera',
          dueDate: '2026-10-19',
        }),
      ],
      now
    )
    expect(tasks).toHaveLength(1)
    expect(tasks[0]?.completed).toBe(false)
    expect(tasks[0]?.urgency).toBe('high')
  })

  it('skips completed items', () => {
    const tasks = workItemsToDashboardTasks(
      [item({ id: '2', title: 'Done', completedAt: '2026-10-01T00:00:00.000Z' })],
      new Date('2026-10-19T12:00:00.000Z')
    )
    expect(tasks).toHaveLength(0)
  })
})
