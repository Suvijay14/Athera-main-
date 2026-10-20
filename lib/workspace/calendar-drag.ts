import { addMinutes, format, parseISO, setHours, setMinutes, startOfDay } from 'date-fns'

import type { WorkItem } from '@/lib/db/schemas'

import { DEFAULT_DURATION_MINUTES } from './parse-quick-add'
import { effectiveTimedEnd } from './calendar-items'

export type CalendarDropTarget =
  | { mode: 'timed'; day: Date; hour: number; minute?: number }
  | { mode: 'all-day'; day: Date }

export type CalendarDragPatch = {
  startAt: string | null
  endAt: string | null
  dueDate: string | null
  allDay?: boolean
}

export function patchForMoveTimedItem(
  item: WorkItem,
  target: Extract<CalendarDropTarget, { mode: 'timed' }>
): CalendarDragPatch {
  const durationMs = item.startAt
    ? effectiveTimedEnd(item, parseISO(item.startAt)).getTime() -
      parseISO(item.startAt).getTime()
    : DEFAULT_DURATION_MINUTES * 60_000
  const minute = target.minute ?? 0
  let start = startOfDay(target.day)
  start = setHours(start, target.hour)
  start = setMinutes(start, minute)
  const end = new Date(start.getTime() + durationMs)
  return {
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    dueDate: null,
    allDay: false,
  }
}

export function patchForResizeTimedItem(item: WorkItem, newEnd: Date): CalendarDragPatch {
  if (!item.startAt) {
    throw new Error('Cannot resize item without startAt')
  }
  const start = parseISO(item.startAt)
  if (newEnd.getTime() <= start.getTime()) {
    return {
      startAt: item.startAt,
      endAt: addMinutes(start, 15).toISOString(),
      dueDate: null,
    }
  }
  return {
    startAt: item.startAt,
    endAt: newEnd.toISOString(),
    dueDate: null,
  }
}

export function patchForScheduleFromTray(
  item: WorkItem,
  target: CalendarDropTarget
): CalendarDragPatch {
  if (target.mode === 'all-day') {
    return {
      startAt: null,
      endAt: null,
      dueDate: format(target.day, 'yyyy-MM-dd'),
      allDay: true,
    }
  }
  const minute = target.minute ?? 0
  let start = startOfDay(target.day)
  start = setHours(start, target.hour)
  start = setMinutes(start, minute)
  const end = addMinutes(start, DEFAULT_DURATION_MINUTES)
  return {
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    dueDate: null,
    allDay: false,
  }
}
