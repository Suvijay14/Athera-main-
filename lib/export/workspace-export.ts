import type { FieldDefinition } from '@/lib/db/schemas'

export type WorkItemExportRow = {
  id: string
  spaceId: string
  title: string
  dueDate: string | null
  notes: string | null
  startAt: string | null
  endAt: string | null
  allDay: boolean
  source: string
  archivedAt: string | null
  completedAt: string | null
  data: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function cellToString(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}

/** One column per field key (sorted); jsonb values stringified. */
export function buildWorkItemsCsv(
  items: WorkItemExportRow[],
  fields: FieldDefinition[]
): string {
  const fieldKeys = [...fields].sort((a, b) => a.position - b.position).map((f) => f.key)
  const baseHeaders = [
    'id',
    'space_id',
    'title',
    'due_date',
    'notes',
    'start_at',
    'end_at',
    'all_day',
    'source',
    'archived_at',
    'completed_at',
    'created_at',
    'updated_at',
  ]
  const headers = [...baseHeaders, ...fieldKeys.map((k) => `field_${k}`)]
  const lines = [headers.join(',')]

  for (const item of items) {
    const base = [
      item.id,
      item.spaceId,
      item.title,
      item.dueDate ?? '',
      item.notes ?? '',
      item.startAt ?? '',
      item.endAt ?? '',
      String(item.allDay),
      item.source,
      item.archivedAt ?? '',
      item.completedAt ?? '',
      item.createdAt,
      item.updatedAt,
    ].map((c) => escapeCsvCell(c))
    const custom = fieldKeys.map((key) =>
      escapeCsvCell(cellToString(item.data[key]))
    )
    lines.push([...base, ...custom].join(','))
  }

  return lines.join('\n')
}

export type WorkspaceJsonExport = {
  exportedAt: string
  workspaceId: string
  spaces: unknown[]
  workItems: unknown[]
  fieldDefinitions: unknown[]
  entities: unknown[]
  viewDefinitions: unknown[]
  recurrenceRules: unknown[]
  pages: unknown[]
  drafts: unknown[]
}

export function buildWorkspaceJsonExport(payload: Omit<WorkspaceJsonExport, 'exportedAt'>): string {
  const doc: WorkspaceJsonExport = {
    exportedAt: new Date().toISOString(),
    ...payload,
  }
  return JSON.stringify(doc, null, 2)
}
