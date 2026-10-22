import { describe, expect, it } from 'vitest'

import { spaceTabViews } from '@/lib/workspace/builtin-space-views'
import type { ViewDefinition } from '@/lib/db/schemas'

function view(partial: Partial<ViewDefinition> & Pick<ViewDefinition, 'id' | 'name' | 'type'>): ViewDefinition {
  return {
    workspaceId: 'w',
    groupByField: null,
    colorByField: null,
    calendarRange: null,
    filters: {},
    visible: true,
    position: 0,
    source: 'user',
    createdAt: '',
    ...partial,
  }
}

describe('builtin-space-views', () => {
  it('hides DB calendar views from tabs (Calendar is always built-in)', () => {
    const views = [
      view({ id: '1', name: 'Calendar', type: 'calendar' }),
      view({ id: '2', name: 'Clients', type: 'grouped', groupByField: 'client' }),
    ]
    expect(spaceTabViews(views).map((v) => v.name)).toEqual(['Clients'])
  })
})
