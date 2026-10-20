import type { DetectionContext } from '@/lib/adaptation/detector-types'
import type {
  FieldDefinition,
  RecurrenceRule,
  Suggestion,
  ViewDefinition,
  WorkItem,
} from '@/lib/db/schemas'

let seq = 0

export function uuid(): string {
  seq += 1
  const hex = seq.toString(16).padStart(12, '0')
  return `00000000-0000-4000-8000-${hex}`
}

export function makeItem(partial: Partial<WorkItem> & Pick<WorkItem, 'title'>): WorkItem {
  const id = partial.id ?? uuid()
  return {
    id,
    workspaceId: partial.workspaceId ?? uuid(),
    spaceId: partial.spaceId ?? uuid(),
    title: partial.title,
    dueDate: partial.dueDate ?? null,
    notes: partial.notes ?? null,
    data: partial.data ?? {},
    startAt: partial.startAt ?? null,
    endAt: partial.endAt ?? null,
    allDay: partial.allDay ?? false,
    source: partial.source ?? 'manual',
    spaceConfidence: partial.spaceConfidence ?? null,
    archivedAt: partial.archivedAt ?? null,
    completedAt: partial.completedAt ?? null,
    recurrenceId: partial.recurrenceId ?? null,
    recurrenceInstanceDate: partial.recurrenceInstanceDate ?? null,
    externalProvider: partial.externalProvider ?? null,
    externalId: partial.externalId ?? null,
    createdAt: partial.createdAt ?? '2026-01-01T12:00:00.000Z',
    updatedAt: partial.updatedAt ?? '2026-01-01T12:00:00.000Z',
  }
}

export function makeField(partial: Partial<FieldDefinition> & Pick<FieldDefinition, 'key' | 'label'>): FieldDefinition {
  return {
    id: partial.id ?? uuid(),
    workspaceId: partial.workspaceId ?? uuid(),
    key: partial.key,
    label: partial.label,
    type: partial.type ?? 'text',
    options: partial.options ?? [],
    entityKind: partial.entityKind ?? null,
    visible: partial.visible ?? true,
    position: partial.position ?? 0,
    source: partial.source ?? 'user',
    createdAt: partial.createdAt ?? '2026-01-01T12:00:00.000Z',
  }
}

export function makeSuggestion(partial: Partial<Suggestion> & Pick<Suggestion, 'dedupeKey'>): Suggestion {
  return {
    id: partial.id ?? uuid(),
    workspaceId: partial.workspaceId ?? uuid(),
    type: partial.type ?? 'test',
    status: partial.status ?? 'pending',
    reason: partial.reason ?? 'test',
    evidence: partial.evidence ?? {},
    confidence: partial.confidence ?? 0.8,
    operations: partial.operations ?? [],
    dedupeKey: partial.dedupeKey,
    createdAt: partial.createdAt ?? '2026-01-01T12:00:00.000Z',
    resolvedAt: partial.resolvedAt ?? null,
  }
}

export function baseContext(overrides: Partial<DetectionContext> = {}): DetectionContext {
  const now = overrides.now ?? new Date('2026-03-01T12:00:00.000Z')
  return {
    workspaceId: uuid(),
    workspaceCreatedAt: '2026-01-01T00:00:00.000Z',
    isFirstWeek: false,
    items: [],
    fields: [],
    views: [] as ViewDefinition[],
    recurrenceRules: [] as RecurrenceRule[],
    recentSuggestions: [],
    now,
    ...overrides,
  }
}
