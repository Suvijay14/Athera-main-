import { describe, expect, it } from 'vitest'

import type { FieldDefinition, Space, ViewDefinition } from '@/lib/db/schemas'
import {
  describeSpaceAdaptation,
  formatCreatedByAthera,
} from '@/lib/workspace/space-attribution'

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

describe('space-attribution', () => {
  it('formats created by Athera suffix', () => {
    expect(formatCreatedByAthera('Grouped by client')).toBe(
      'Grouped by client · created by Athera'
    )
  })

  it('describes parent space with child spaces and entity field', () => {
    const parent = space({ id: 'p', name: 'Clients' })
    const child = space({ id: 'c', name: 'Rivera', parentSpaceId: 'p' })
    const fields: FieldDefinition[] = [
      {
        id: 'f',
        workspaceId: 'w',
        key: 'client',
        label: 'Client',
        type: 'entity',
        options: [],
        entityKind: 'client',
        visible: true,
        position: 0,
        source: 'athera',
        createdAt: '',
      },
    ]
    expect(describeSpaceAdaptation(parent, [parent, child], fields, [])).toBe(
      'Grouped by client'
    )
  })
})
