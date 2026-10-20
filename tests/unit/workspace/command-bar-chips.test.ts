import { describe, expect, it } from 'vitest'

import type { Entity, FieldDefinition } from '@/lib/db/schemas'
import { deriveCommandBarChips } from '@/lib/workspace/command-bar-chips'

const spaceId = '00000000-0000-4000-8000-000000000010'

describe('deriveCommandBarChips', () => {
  it('includes calendar chip when items are dated and no calendar view', () => {
    const fields: FieldDefinition[] = []
    const chips = deriveCommandBarChips({
      spaceItems: [{ startAt: '2026-03-01T10:00:00.000Z', dueDate: null }],
      spaceEntities: [],
      fields,
      views: [],
      activeViewId: null,
    })
    expect(chips.some((c) => c.id === 'calendar')).toBe(true)
    expect(chips.some((c) => c.id === 'add-task')).toBe(true)
  })

  it('includes entity-only chips for recent entities', () => {
    const ent: Entity = {
      id: 'e1',
      workspaceId: 'w',
      spaceId,
      kind: 'client',
      name: 'Acme Corp',
      aliases: [],
      color: null,
      archivedAt: null,
      lastActivityAt: '2026-03-01T00:00:00.000Z',
      typicalGapDays: null,
      excludedFromSuggestions: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }
    const chips = deriveCommandBarChips({
      spaceItems: [{ startAt: null, dueDate: null }],
      spaceEntities: [ent],
      fields: [],
      views: [],
      activeViewId: null,
    })
    expect(chips.some((c) => c.label === 'Only Acme Corp')).toBe(true)
  })
})
