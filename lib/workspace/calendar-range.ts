import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
} from 'date-fns'

import type { CalendarRange } from './calendar-items'

export const CALENDAR_WEEK_STARTS_ON = 0 as const

export const CALENDAR_VISIBLE_HOUR_START = 6
export const CALENDAR_VISIBLE_HOUR_END = 22
export const CALENDAR_HOUR_HEIGHT_PX = 48

export function weekRangeContaining(anchor: Date): CalendarRange {
  const start = startOfWeek(anchor, { weekStartsOn: CALENDAR_WEEK_STARTS_ON })
  const end = endOfWeek(anchor, { weekStartsOn: CALENDAR_WEEK_STARTS_ON })
  return { start, end }
}

export function monthRangeContaining(anchor: Date): CalendarRange {
  return { start: startOfMonth(anchor), end: endOfMonth(anchor) }
}

export function shiftAnchor(
  anchor: Date,
  mode: 'week' | 'month',
  direction: -1 | 0 | 1
): Date {
  if (direction === 0) {
    return new Date()
  }
  if (mode === 'week') {
    return addWeeks(anchor, direction)
  }
  return addMonths(anchor, direction)
}

export function daysInMonthGrid(anchor: Date): Date[] {
  const monthStart = startOfMonth(anchor)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: CALENDAR_WEEK_STARTS_ON })
  const days: Date[] = []
  for (let i = 0; i < 42; i++) {
    days.push(addDays(gridStart, i))
  }
  return days
}

export function weekDayColumns(anchor: Date): Date[] {
  const start = startOfWeek(anchor, { weekStartsOn: CALENDAR_WEEK_STARTS_ON })
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}
