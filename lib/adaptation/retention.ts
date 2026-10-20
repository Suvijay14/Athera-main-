import { differenceInCalendarDays, parseISO } from 'date-fns'

import { parseSuggestionOperations } from '@/lib/adaptation/preview-build'
import type { Operation } from '@/lib/adaptation/types'
import type {
  AppEvent,
  ChangeLogEntry,
  FieldDefinition,
  RecurrenceRule,
  ViewDefinition,
  WorkItem,
} from '@/lib/db/schemas'

/** Half of post-change items should still use a new field for the adaptation to stick. */
export const RETENTION_FILL_THRESHOLD = 0.5

export const RETENTION_EVALUATION_DAYS = 14

export type RetentionOutcome = 'retained' | 'abandoned' | 'not_yet_evaluable'

export type RetentionInput = {
  changeLogEntry: ChangeLogEntry
  suggestionType: string
  recentEvents: AppEvent[]
  items: WorkItem[]
  fields: FieldDefinition[]
  views: ViewDefinition[]
  recurrenceRules: RecurrenceRule[]
  now: Date
}

/** Caller must exclude change_log rows with undone_at set before calling determineRetention. */
export function isEligibleForRetentionEvaluation(entry: ChangeLogEntry, now: Date): boolean {
  if (entry.undoneAt !== null) {
    return false
  }
  const ageDays = differenceInCalendarDays(now, parseISO(entry.appliedAt))
  return ageDays >= RETENTION_EVALUATION_DAYS
}

function isValuePresent(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false
  }
  if (typeof value === 'string') {
    return value.trim().length > 0
  }
  return true
}

function primaryOperation(operations: Operation[]): Operation | null {
  return operations[0] ?? null
}

function findViewCreatedByChange(
  views: ViewDefinition[],
  viewName: string,
  appliedAt: string
): ViewDefinition | undefined {
  const applied = parseISO(appliedAt).getTime()
  const candidates = views.filter(
    (v) => v.name === viewName && parseISO(v.createdAt).getTime() >= applied - 60_000
  )
  candidates.sort(
    (a, b) => parseISO(a.createdAt).getTime() - parseISO(b.createdAt).getTime()
  )
  return candidates[0]
}

function evaluateCreateView(
  op: Extract<Operation, { op: 'create_view' }>,
  input: RetentionInput
): RetentionOutcome {
  const view = findViewCreatedByChange(input.views, op.view.name, input.changeLogEntry.appliedAt)
  if (!view) {
    return 'abandoned'
  }
  const opened = input.recentEvents.some(
    (e) =>
      e.name === 'view_opened' &&
      e.props.viewId === view.id &&
      typeof e.props.viewType === 'string'
  )
  return opened ? 'retained' : 'abandoned'
}

function evaluateFieldBackfill(
  fieldKey: string,
  input: RetentionInput
): RetentionOutcome {
  const applied = parseISO(input.changeLogEntry.appliedAt)
  const qualifying = input.items.filter(
    (item) => parseISO(item.createdAt).getTime() >= applied.getTime()
  )
  if (qualifying.length === 0) {
    return 'abandoned'
  }
  let filled = 0
  for (const item of qualifying) {
    if (isValuePresent(item.data[fieldKey])) {
      filled += 1
    }
  }
  const rate = filled / qualifying.length
  return rate >= RETENTION_FILL_THRESHOLD ? 'retained' : 'abandoned'
}

function evaluateRecurrenceRule(
  op: Extract<Operation, { op: 'create_recurrence_rule' }>,
  input: RetentionInput
): RetentionOutcome {
  const templateTitle =
    typeof op.rule.templateItem.title === 'string' ? op.rule.templateItem.title : null

  const applied = parseISO(input.changeLogEntry.appliedAt).getTime()
  const match = input.recurrenceRules.find((rule) => {
    if (rule.intervalCount !== op.rule.intervalCount) {
      return false
    }
    if (parseISO(rule.createdAt).getTime() < applied - 60_000) {
      return false
    }
    const t = rule.templateItem
    if (templateTitle && typeof t.title === 'string') {
      return t.title === templateTitle
    }
    return true
  })

  if (!match) {
    return 'abandoned'
  }
  return match.active ? 'retained' : 'abandoned'
}

function evaluateHideField(
  op: Extract<Operation, { op: 'set_field_visibility' }>,
  input: RetentionInput
): RetentionOutcome {
  if (op.visible !== false) {
    return 'abandoned'
  }
  const field = input.fields.find((f) => f.key === op.key)
  if (!field) {
    return 'abandoned'
  }
  return field.visible ? 'abandoned' : 'retained'
}

export function determineRetention(input: RetentionInput): RetentionOutcome {
  if (input.changeLogEntry.undoneAt !== null) {
    throw new Error('determineRetention must not be called for undone changes')
  }

  const ageDays = differenceInCalendarDays(
    input.now,
    parseISO(input.changeLogEntry.appliedAt)
  )
  if (ageDays < RETENTION_EVALUATION_DAYS) {
    return 'not_yet_evaluable'
  }

  const operations = parseSuggestionOperations(input.changeLogEntry.operations)
  const primary = primaryOperation(operations)
  if (!primary) {
    return 'abandoned'
  }

  switch (primary.op) {
    case 'create_view':
      return evaluateCreateView(primary, input)
    case 'create_field': {
      const backfill = operations.find(
        (o): o is Extract<Operation, { op: 'backfill_field' }> =>
          o.op === 'backfill_field' && o.key === primary.field.key
      )
      if (backfill) {
        return evaluateFieldBackfill(primary.field.key, input)
      }
      return 'abandoned'
    }
    case 'backfill_field':
      return evaluateFieldBackfill(primary.key, input)
    case 'create_recurrence_rule':
      return evaluateRecurrenceRule(primary, input)
    case 'set_field_visibility':
      return evaluateHideField(primary, input)
    default:
      return 'abandoned'
  }
}
