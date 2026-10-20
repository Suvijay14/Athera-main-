import { describe, expect, it } from 'vitest'

import {
  computeQuietEntityIds,
  entityNavInitial,
  groupEntitiesBySpace,
} from '@/lib/workspace/compute-quiet-entity-ids'
import { isArchiveCandidateEntity } from '@/lib/adaptation/detectors/detect-archive-entity'
import type { Entity, FieldDefinition } from '@/lib/db/schemas'
import { makeItem } from '../detectors/fixtures'

const now = new Date('2026-03-15T12:00:00.000Z')
const spaceId = '00000000-0000-4000-8000-000000000010'
const entityId = '00000000-0000-4000-8000-000000000020'
const wsId = '00000000-0000-4000-8000-000000000099'

function entity(partial: Partial<Entity> = {}): Entity {
  return {
    id: entityId,
    workspaceId: wsId,
    spaceId,
    kind: 'client',
    name: 'Rivera Bakery',
    aliases: [],
    color: null,
    archivedAt: null,
    lastActivityAt: null,
    typicalGapDays: null,
    excludedFromSuggestions: false,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...partial,
  }
}

const clientField: FieldDefinition = {
  id: 'f1',
  workspaceId: wsId,
  key: 'client',
  label: 'Client',
  type: 'entity',
  options: [],
  entityKind: 'client',
  visible: true,
  position: 0,
  source: 'user',
  createdAt: '2025-01-01T00:00:00.000Z',
}

function workItem(id: string, date: string) {
  return makeItem({
    id,
    workspaceId: wsId,
    spaceId,
    title: `Job ${id}`,
    dueDate: date,
    data: { client: entityId },
    createdAt: '2025-06-01T00:00:00.000Z',
  })
}

describe('computeQuietEntityIds', () => {
  it('marks entity quiet when archive candidate logic fires', () => {
    const items = [
      workItem('i1', '2025-06-01'),
      workItem('i2', '2025-06-08'),
      workItem('i3', '2025-06-15'),
    ]
    const quiet = computeQuietEntityIds([entity()], items, [clientField], [], now)
    expect(quiet.has(entityId)).toBe(true)
  })

  it('uses isArchiveCandidateEntity — not a duplicate threshold', () => {
    const items = [
      workItem('i1', '2025-06-01'),
      workItem('i2', '2025-06-08'),
      workItem('i3', '2025-06-15'),
    ]
    const quiet = computeQuietEntityIds([entity()], items, [clientField], [], now)
    expect(quiet.size).toBe(1)
    expect(isArchiveCandidateEntity).toBeDefined()
  })

  it('does not mark excluded entities', () => {
    const items = [
      workItem('i1', '2025-06-01'),
      workItem('i2', '2025-06-08'),
      workItem('i3', '2025-06-15'),
    ]
    const quiet = computeQuietEntityIds(
      [entity({ excludedFromSuggestions: true })],
      items,
      [clientField],
      [],
      now
    )
    expect(quiet.size).toBe(0)
  })
})

describe('groupEntitiesBySpace', () => {
  it('groups and sorts by name', () => {
    const map = groupEntitiesBySpace([
      entity({ id: 'a', name: 'Zed', spaceId }),
      entity({ id: 'b', name: 'Amy', spaceId }),
      entity({ id: 'c', name: 'Other', spaceId: '00000000-0000-4000-8000-000000000011' }),
    ])
    expect(map.get(spaceId)?.map((e) => e.name)).toEqual(['Amy', 'Zed'])
    expect(map.get('00000000-0000-4000-8000-000000000011')?.length).toBe(1)
  })
})

describe('entityNavInitial', () => {
  it('returns uppercase first letter', () => {
    expect(entityNavInitial('rivera')).toBe('R')
    expect(entityNavInitial('')).toBe('?')
  })
})

describe('sidebar expand state (pure)', () => {
  it('toggles membership like the UI Set helper', () => {
    const toggle = (prev: Set<string>, id: string) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    }
    let s = toggle(new Set(), spaceId)
    expect(s.has(spaceId)).toBe(true)
    s = toggle(s, spaceId)
    expect(s.has(spaceId)).toBe(false)
  })
})
