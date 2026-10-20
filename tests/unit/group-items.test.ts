import { describe, expect, it } from 'vitest'

import type { WorkItem } from '@/lib/db/schemas'
import { groupItemsByField } from '@/lib/workspace/group-items'

const item = (id: string, data: Record<string, unknown>): WorkItem => ({
  id,
  workspaceId: '00000000-0000-4000-8000-000000000099',
  spaceId: '00000000-0000-4000-8000-000000000010',
  title: `Item ${id}`,
  dueDate: null,
  notes: null,
  data,
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
})

describe('groupItemsByField', () => {
  it('groups by string equality and puts missing values in Unassigned last', () => {
    const items = [
      item('1', { lane: 'A' }),
      item('2', { lane: 'B' }),
      item('3', {}),
      item('4', { lane: 'A' }),
    ]
    const groups = groupItemsByField(items, 'lane')
    expect(groups.map((g) => g.label)).toEqual(['A', 'B', 'Unassigned'])
    expect(groups[0]?.items).toHaveLength(2)
    expect(groups[2]?.items).toHaveLength(1)
    expect(groups[2]?.items[0]?.id).toBe('3')
  })
})
