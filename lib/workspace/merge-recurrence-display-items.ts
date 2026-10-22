import { format, parseISO } from 'date-fns'

import type { RecurrenceRule, WorkItem } from '@/lib/db/schemas'

import { generateInstances } from './recurrence'
import type { RecurrenceInstance } from './recurrence-types'
import { parseVirtualRecurrenceId } from './recurrence-types'

export type DisplayWorkItem = WorkItem & {
  isVirtualRecurrence?: boolean
  recurrenceId?: string | null
  recurrenceInstanceDate?: string | null
}

function instanceToDisplayItem(
  workspaceId: string,
  inst: RecurrenceInstance,
  now: Date
): DisplayWorkItem {
  return {
    id: inst.virtualId,
    workspaceId,
    spaceId: inst.spaceId,
    title: inst.title,
    dueDate: inst.dueDate,
    notes: inst.notes,
    data: inst.data,
    startAt: inst.startAt,
    endAt: inst.endAt,
    allDay: inst.allDay,
    source: 'recurrence',
    elementKind: 'task',
    spaceConfidence: null,
    archivedAt: null,
    completedAt: null,
    recurrenceId: inst.recurrenceId,
    recurrenceInstanceDate: inst.instanceDate,
    externalProvider: null,
    externalId: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    isVirtualRecurrence: true,
  }
}

/** yyyy-mm-dd for a stored occurrence (explicit column or inferred from schedule). */
export function instanceDateFromWorkItem(item: WorkItem): string | null {
  if (item.recurrenceInstanceDate?.trim()) {
    return item.recurrenceInstanceDate.trim()
  }
  if (!item.recurrenceId) {
    return null
  }
  if (item.startAt?.trim()) {
    try {
      return format(parseISO(item.startAt), 'yyyy-MM-dd')
    } catch {
      return null
    }
  }
  if (item.dueDate?.trim()) {
    return item.dueDate.trim()
  }
  return null
}

function coveredRecurrenceKeys(items: WorkItem[]): Set<string> {
  const keys = new Set<string>()
  for (const item of items) {
    if (!item.recurrenceId) {
      continue
    }
    const date = instanceDateFromWorkItem(item)
    if (date) {
      keys.add(`${item.recurrenceId}:${date}`)
    }
  }
  return keys
}

export function mergeWorkItemsWithRecurrenceInstances(
  workspaceId: string,
  storedItems: WorkItem[],
  rules: RecurrenceRule[],
  rangeStart: Date,
  rangeEnd: Date,
  now: Date = new Date()
): DisplayWorkItem[] {
  const covered = coveredRecurrenceKeys(storedItems)

  const virtual: DisplayWorkItem[] = []
  for (const rule of rules) {
    if (!rule.active) {
      continue
    }
    for (const inst of generateInstances(rule, rangeStart, rangeEnd)) {
      const key = `${inst.recurrenceId}:${inst.instanceDate}`
      if (covered.has(key)) {
        continue
      }
      virtual.push(instanceToDisplayItem(workspaceId, inst, now))
    }
  }

  const storedDisplay: DisplayWorkItem[] = storedItems.map((item) => ({
    ...item,
    isVirtualRecurrence: false,
  }))

  return [...storedDisplay, ...virtual].sort((a, b) => {
    const ta = a.startAt ?? (a.dueDate ? `${a.dueDate}T12:00:00.000Z` : a.createdAt)
    const tb = b.startAt ?? (b.dueDate ? `${b.dueDate}T12:00:00.000Z` : b.createdAt)
    return ta.localeCompare(tb)
  })
}

export function resolveItemOpenId(itemId: string): {
  kind: 'stored' | 'virtual'
  storedId?: string
  virtual?: { recurrenceId: string; instanceDate: string }
} {
  const parsed = parseVirtualRecurrenceId(itemId)
  if (parsed) {
    return { kind: 'virtual', virtual: parsed }
  }
  return { kind: 'stored', storedId: itemId }
}
