import type { FieldDefinition, ViewDefinition } from '@/lib/db/schemas'
import type { Operation } from '@/lib/adaptation/types'
import type { ViewRequestFilter, ViewRequestSpec } from '@/lib/workspace/view-request-types'

export type ResolvedViewRequest =
  | { action: 'switch'; viewId: string }
  | { action: 'create'; view: Operation & { op: 'create_view' }; suggestionReason: string }
  | { action: 'unsupported'; message?: string }

export type ViewFiltersJson = {
  clauses: ViewRequestFilter[]
}

export function normalizeViewFilters(filters: ViewRequestFilter[]): ViewFiltersJson {
  const clauses = [...filters].sort((a, b) =>
    `${a.field}:${a.op}:${a.value}`.localeCompare(`${b.field}:${b.op}:${b.value}`)
  )
  return { clauses }
}

function filtersEqual(a: ViewFiltersJson | undefined, b: ViewFiltersJson | undefined): boolean {
  return JSON.stringify(a ?? { clauses: [] }) === JSON.stringify(b ?? { clauses: [] })
}

function viewDbType(spec: Extract<ViewRequestSpec, { spaceId: string }>): 'list' | 'grouped' | 'calendar' {
  if (spec.type === 'calendar') {
    return 'calendar'
  }
  if (spec.groupBy) {
    return 'grouped'
  }
  return 'list'
}

function viewMatchesSpec(view: ViewDefinition, spec: Extract<ViewRequestSpec, { spaceId: string }>): boolean {
  const dbType = viewDbType(spec)
  if (view.type !== dbType) {
    return false
  }
  if (spec.type === 'calendar') {
    if ((view.calendarRange ?? 'week') !== (spec.range ?? 'week')) {
      return false
    }
  }
  const groupField = spec.groupBy ?? null
  if ((view.groupByField ?? null) !== groupField) {
    return false
  }
  if ((view.colorByField ?? null) !== (spec.colorBy ?? null)) {
    return false
  }
  const viewFilters = view.filters as ViewFiltersJson | undefined
  return filtersEqual(viewFilters, normalizeViewFilters(spec.filters))
}

function viewNameForSpec(spec: Extract<ViewRequestSpec, { spaceId: string }>): string {
  if (spec.type === 'calendar') {
    return spec.range === 'month' ? 'Calendar (month)' : 'Calendar'
  }
  if (spec.groupBy) {
    return `Grouped by ${spec.groupBy}`
  }
  if (spec.filters.length > 0) {
    return 'Filtered list'
  }
  return 'List'
}

export function resolveViewRequest(
  spec: ViewRequestSpec,
  views: ViewDefinition[],
  fields: FieldDefinition[]
): ResolvedViewRequest {
  if ('unsupported' in spec) {
    return { action: 'unsupported' }
  }

  for (const filter of spec.filters) {
    const field = fields.find((f) => f.key === filter.field)
    if (!field) {
      return {
        action: 'unsupported',
        message: 'That filter needs a field that does not exist yet.',
      }
    }
  }

  const existing = views.find((v) => v.visible && viewMatchesSpec(v, spec))
  if (existing) {
    return { action: 'switch', viewId: existing.id }
  }

  if (!spec.save) {
    return {
      action: 'unsupported',
      message: 'One-off views are not supported yet. Try asking to save the view.',
    }
  }

  const dbType = viewDbType(spec)
  const viewPayload = {
    name: viewNameForSpec(spec),
    type: dbType,
    groupByField: dbType === 'grouped' ? spec.groupBy ?? undefined : undefined,
    colorByField: spec.colorBy ?? undefined,
    calendarRange: dbType === 'calendar' ? spec.range ?? 'week' : undefined,
    filters: normalizeViewFilters(spec.filters),
  }

  return {
    action: 'create',
    view: {
      op: 'create_view',
      view: viewPayload,
    },
    suggestionReason: `Added ${viewPayload.name} from your command.`,
  }
}
