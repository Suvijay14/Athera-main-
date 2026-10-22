import { describe, expect, it } from 'vitest'

import type { Space } from '@/lib/db/schemas'
import {
  buildChildSpacesByParentId,
  rollupItemCountsBySpace,
  topLevelSpaces,
} from '@/lib/workspace/space-hierarchy'

function space(partial: Partial<Space> & Pick<Space, 'id' | 'name'>): Space {
  return {
    workspaceId: 'w',
    parentSpaceId: null,
    icon: null,
    color: null,
    sortOrder: 0,
    isDefault: false,
    archivedAt: null,
    createdAt: '',
    updatedAt: '',
    ...partial,
  }
}

describe('space-hierarchy', () => {
  it('rolls up item counts to parent spaces', () => {
    const parent = space({ id: 'p', name: 'Clients', sortOrder: 0 })
    const child = space({ id: 'c', name: 'Rivera', parentSpaceId: 'p', sortOrder: 0 })
    const rolled = rollupItemCountsBySpace({ p: 0, c: 3 }, [parent, child])
    expect(rolled.c).toBe(3)
    expect(rolled.p).toBe(3)
  })

  it('lists only top-level active spaces', () => {
    const parent = space({ id: 'p', name: 'Clients' })
    const child = space({ id: 'c', name: 'Rivera', parentSpaceId: 'p' })
    expect(topLevelSpaces([parent, child]).map((s) => s.id)).toEqual(['p'])
    const byParent = buildChildSpacesByParentId([parent, child])
    expect(byParent.get('p')?.map((s) => s.id)).toEqual(['c'])
  })
})
