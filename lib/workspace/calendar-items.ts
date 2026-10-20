import { addMinutes, parseISO, startOfDay, endOfDay, isWithinInterval } from 'date-fns'

import type { WorkItem } from '@/lib/db/schemas'

import { DEFAULT_DURATION_MINUTES } from './parse-quick-add'

export type CalendarRange = {
  start: Date
  end: Date
}

export type TimedCalendarItem = {
  item: WorkItem
  start: Date
  end: Date
}

export type AllDayCalendarItem = {
  item: WorkItem
  date: Date
}

export type CalendarBuckets = {
  timed: TimedCalendarItem[]
  allDay: AllDayCalendarItem[]
  unscheduled: WorkItem[]
}

function hasStartAt(item: WorkItem): boolean {
  return Boolean(item.startAt?.trim())
}

function hasDueDate(item: WorkItem): boolean {
  return Boolean(item.dueDate?.trim())
}

export function isUnscheduledItem(item: WorkItem): boolean {
  return !hasStartAt(item) && !hasDueDate(item)
}

export function effectiveTimedEnd(item: WorkItem, start: Date): Date {
  if (item.endAt) {
    return parseISO(item.endAt)
  }
  return addMinutes(start, DEFAULT_DURATION_MINUTES)
}

function intervalsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart.getTime() < bEnd.getTime() && aEnd.getTime() > bStart.getTime()
}

export function bucketCalendarItems(items: WorkItem[], range: CalendarRange): CalendarBuckets {
  const timed: TimedCalendarItem[] = []
  const allDay: AllDayCalendarItem[] = []
  const unscheduled: WorkItem[] = []

  for (const item of items) {
    if (isUnscheduledItem(item)) {
      unscheduled.push(item)
      continue
    }

    if (hasStartAt(item)) {
      const start = parseISO(item.startAt!)
      const end = effectiveTimedEnd(item, start)
      if (intervalsOverlap(start, end, range.start, range.end)) {
        timed.push({ item, start, end })
      }
      continue
    }

    if (hasDueDate(item)) {
      const date = parseISO(`${item.dueDate}T12:00:00.000Z`)
      if (
        isWithinInterval(date, {
          start: startOfDay(range.start),
          end: endOfDay(range.end),
        })
      ) {
        allDay.push({ item, date })
      }
    }
  }

  timed.sort((a, b) => a.start.getTime() - b.start.getTime())
  allDay.sort((a, b) => a.date.getTime() - b.date.getTime())

  return { timed, allDay, unscheduled }
}
