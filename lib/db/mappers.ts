import type { Database } from './database.types'
import { toJson } from './json'
import type {
  AppEvent,
  ChangeLogEntry,
  Entity,
  FieldDefinition,
  RecurrenceRule,
  Space,
  Suggestion,
  ViewDefinition,
  WorkItem,
  Workspace,
} from './schemas'

type WorkspaceRow = Database['public']['Tables']['workspaces']['Row']
type SpaceRow = Database['public']['Tables']['spaces']['Row']
type EntityRow = Database['public']['Tables']['entities']['Row']
type FieldRow = Database['public']['Tables']['field_definitions']['Row']
type WorkItemRow = Database['public']['Tables']['work_items']['Row']
type ViewRow = Database['public']['Tables']['view_definitions']['Row']
type RecurrenceRow = Database['public']['Tables']['recurrence_rules']['Row']
type SuggestionRow = Database['public']['Tables']['suggestions']['Row']
type ChangeLogRow = Database['public']['Tables']['change_log']['Row']
type EventRow = Database['public']['Tables']['events']['Row']

function optionsFromJson(value: FieldRow['options']): string[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter((v): v is string => typeof v === 'string')
}

function recordFromJson(value: unknown): Record<string, unknown> {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

function arrayFromJson(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function stringArrayFromRow(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter((v): v is string => typeof v === 'string')
}

export function mapWorkspaceRow(row: WorkspaceRow): Workspace {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    businessType: row.business_type,
    itemLabel: row.item_label,
    onboardingAnswers: recordFromJson(row.onboarding_answers),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapWorkspaceToUpdate(row: Partial<Workspace>): Database['public']['Tables']['workspaces']['Update'] {
  return {
    name: row.name,
    business_type: row.businessType,
    item_label: row.itemLabel,
    onboarding_answers: row.onboardingAnswers ? toJson(row.onboardingAnswers) : undefined,
  }
}

export function mapSpaceRow(row: SpaceRow): Space {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    parentSpaceId: row.parent_space_id ?? null,
    name: row.name,
    icon: row.icon,
    color: row.color,
    sortOrder: row.sort_order,
    isDefault: row.is_default,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapEntityRow(row: EntityRow): Entity {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    spaceId: row.space_id,
    kind: row.kind,
    name: row.name,
    aliases: stringArrayFromRow(row.aliases),
    color: row.color,
    archivedAt: row.archived_at,
    lastActivityAt: row.last_activity_at,
    typicalGapDays: row.typical_gap_days !== null ? Number(row.typical_gap_days) : null,
    excludedFromSuggestions: row.excluded_from_suggestions,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapFieldDefinitionRow(row: FieldRow): FieldDefinition {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    key: row.key,
    label: row.label,
    type: row.type as FieldDefinition['type'],
    options: optionsFromJson(row.options),
    entityKind: row.entity_kind,
    visible: row.visible,
    position: row.position,
    source: row.source as FieldDefinition['source'],
    createdAt: row.created_at,
  }
}

export function mapWorkItemRow(row: WorkItemRow): WorkItem {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    spaceId: row.space_id,
    title: row.title,
    dueDate: row.due_date,
    notes: row.notes,
    data: recordFromJson(row.data),
    startAt: row.start_at,
    endAt: row.end_at,
    allDay: row.all_day,
    source: row.source as WorkItem['source'],
    spaceConfidence: row.space_confidence !== null ? Number(row.space_confidence) : null,
    archivedAt: row.archived_at,
    completedAt: row.completed_at,
    recurrenceId: row.recurrence_id,
    recurrenceInstanceDate: row.recurrence_instance_date,
    externalProvider: row.external_provider ?? null,
    externalId: row.external_id ?? null,
    elementKind: (row.element_kind as WorkItem['elementKind']) ?? 'task',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapViewDefinitionRow(row: ViewRow): ViewDefinition {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    type: row.type as ViewDefinition['type'],
    groupByField: row.group_by_field,
    colorByField: row.color_by_field,
    calendarRange: row.calendar_range as ViewDefinition['calendarRange'],
    filters: recordFromJson(row.filters),
    visible: row.visible,
    position: row.position,
    source: row.source as ViewDefinition['source'],
    createdAt: row.created_at,
  }
}

export function mapRecurrenceRuleRow(row: RecurrenceRow): RecurrenceRule {
  const extended = row as RecurrenceRow & {
    space_id?: string
    template_item?: unknown
    freq?: string
    interval_count?: number
    by_weekday?: number[]
    time_of_day?: string | null
    duration_min?: number | null
    starts_on?: string
    ends_on?: string | null
    exceptions?: string[]
  }
  const timeRaw = extended.time_of_day
  const timeOfDay =
    typeof timeRaw === 'string' && timeRaw.length >= 5 ? timeRaw.slice(0, 5) : null
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    spaceId: extended.space_id ?? '',
    templateItem: recordFromJson(extended.template_item ?? {}),
    freq: 'weekly',
    intervalCount: (extended.interval_count === 2 ? 2 : 1) as 1 | 2,
    byWeekday: extended.by_weekday ?? [],
    timeOfDay,
    durationMin: extended.duration_min ?? null,
    startsOn: extended.starts_on ?? '1970-01-01',
    endsOn: extended.ends_on ?? null,
    exceptions: extended.exceptions ?? [],
    active: row.active,
    source: row.source as RecurrenceRule['source'],
    createdAt: row.created_at,
  }
}

export function mapSuggestionRow(row: SuggestionRow): Suggestion {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    type: row.type,
    status: row.status as Suggestion['status'],
    reason: row.reason,
    evidence: recordFromJson(row.evidence),
    confidence: Number(row.confidence),
    operations: arrayFromJson(row.operations),
    dedupeKey: row.dedupe_key,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
  }
}

export function mapChangeLogRow(row: ChangeLogRow): ChangeLogEntry {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    suggestionId: row.suggestion_id,
    operations: arrayFromJson(row.operations),
    inverseOperations: arrayFromJson(row.inverse_operations),
    appliedAt: row.applied_at,
    undoneAt: row.undone_at,
  }
}

export function mapAppEventRow(row: EventRow): AppEvent {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    name: row.name as AppEvent['name'],
    props: recordFromJson(row.props),
    createdAt: row.created_at,
  }
}
