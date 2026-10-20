import { describe, expect, it } from 'vitest'

import { buildWorkItemsCsv, buildWorkspaceJsonExport } from '@/lib/export/workspace-export'
import type { FieldDefinition } from '@/lib/db/schemas'

const fields: FieldDefinition[] = [
  {
    id: 'f1',
    workspaceId: 'w1',
    key: 'client',
    label: 'Client',
    type: 'text',
    options: [],
    entityKind: null,
    visible: true,
    position: 0,
    source: 'user',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
]

describe('buildWorkItemsCsv', () => {
  it('includes base columns and flattened custom fields', () => {
    const csv = buildWorkItemsCsv(
      [
        {
          id: 'i1',
          spaceId: 's1',
          title: 'Job, "special"',
          dueDate: '2026-10-10',
          notes: null,
          startAt: null,
          endAt: null,
          allDay: false,
          source: 'manual',
          archivedAt: null,
          completedAt: null,
          data: { client: 'Rivera' },
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      fields
    )
    expect(csv.split('\n')[0]).toContain('field_client')
    expect(csv).toContain('"Job, ""special"""')
    expect(csv).toContain('Rivera')
  })
})

describe('buildWorkspaceJsonExport', () => {
  it('wraps payload with exportedAt', () => {
    const json = buildWorkspaceJsonExport({
      workspaceId: 'w1',
      spaces: [],
      workItems: [],
      fieldDefinitions: [],
      entities: [],
      viewDefinitions: [],
      recurrenceRules: [],
      pages: [],
      drafts: [],
    })
    const parsed = JSON.parse(json) as { exportedAt: string; workspaceId: string }
    expect(parsed.workspaceId).toBe('w1')
    expect(parsed.exportedAt).toBeTruthy()
  })
})
