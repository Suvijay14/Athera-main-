import { describe, expect, it } from 'vitest'

import type { Entity, FieldDefinition, WorkItem } from '@/lib/db/schemas'
import { colorForItemField, colorForSelectValue } from '@/lib/workspace/calendar-colors'

describe('calendar-colors', () => {
  it('uses entity color when field is entity type', () => {
    const field: FieldDefinition = {
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
    }
    const ent: Entity = {
      id: 'e1',
      workspaceId: 'w',
      spaceId: 's',
      kind: 'client',
      name: 'Dana',
      aliases: [],
      color: '#ff0000',
      archivedAt: null,
      lastActivityAt: null,
      typicalGapDays: null,
      excludedFromSuggestions: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }
    const item: WorkItem = {
      id: 'i1',
      workspaceId: 'w',
      spaceId: 's',
      title: 'T',
      dueDate: null,
      notes: null,
      data: { client: 'e1' },
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
    }
    expect(colorForItemField(item, field, new Map([['e1', ent]]))).toBe('#ff0000')
  })

  it('hashes select values to palette', () => {
    const a = colorForSelectValue('Active')
    const b = colorForSelectValue('Active')
    expect(a).toBe(b)
    expect(a.startsWith('#')).toBe(true)
  })
})
