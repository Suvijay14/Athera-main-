import { describe, expect, it } from 'vitest'

import type { FieldDefinition, ViewDefinition } from '@/lib/db/schemas'
import { resolveViewRequest } from '@/lib/workspace/resolve-view-request'

const fields: FieldDefinition[] = [
  {
    id: 'f1',
    workspaceId: 'w',
    key: 'client',
    label: 'Client',
    type: 'entity',
    options: [],
    entityKind: 'client',
    visible: true,
    position: 0,
    source: 'athera',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
]

const calendarView: ViewDefinition = {
  id: 'v-cal',
  workspaceId: 'w',
  name: 'Calendar',
  type: 'calendar',
  groupByField: null,
  colorByField: null,
  calendarRange: 'week',
  filters: { clauses: [] },
  visible: true,
  position: 0,
  source: 'user',
  createdAt: '2026-01-01T00:00:00.000Z',
}

describe('resolveViewRequest', () => {
  it('switches to matching calendar view', () => {
    const result = resolveViewRequest(
      {
        spaceId: 's',
        type: 'calendar',
        range: 'week',
        groupBy: null,
        colorBy: null,
        filters: [],
        save: true,
      },
      [calendarView],
      fields
    )
    expect(result).toEqual({ action: 'switch', viewId: 'v-cal' })
  })

  it('creates view when save true and no match', () => {
    const result = resolveViewRequest(
      {
        spaceId: 's',
        type: 'calendar',
        range: 'month',
        groupBy: null,
        colorBy: null,
        filters: [],
        save: true,
      },
      [calendarView],
      fields
    )
    expect(result.action).toBe('create')
    if (result.action === 'create') {
      expect(result.view.op).toBe('create_view')
      expect(result.view.view.type).toBe('calendar')
      expect(result.view.view.calendarRange).toBe('month')
    }
  })

  it('unsupported when filter field missing from workspace', () => {
    const result = resolveViewRequest(
      {
        spaceId: 's',
        type: 'list',
        range: null,
        groupBy: null,
        colorBy: null,
        filters: [{ field: 'missing', op: 'is', value: 'x' }],
        save: true,
      },
      [],
      fields
    )
    expect(result.action).toBe('unsupported')
  })
})
