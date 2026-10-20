import { format, isSameDay, parseISO, startOfDay } from 'date-fns'

import type { WorkItem } from '@/lib/db/schemas'
import { isOpenWorkItem, itemsForToday, itemsUpcomingDays } from '@/lib/workspace/overview-logic'
import type { CalendarEvent, Task } from '@/lib/types'

function scheduleDate(item: WorkItem): Date | null {
  if (item.startAt) {
    try {
      return parseISO(item.startAt)
    } catch {
      return null
    }
  }
  if (item.dueDate) {
    try {
      return parseISO(`${item.dueDate}T12:00:00`)
    } catch {
      return null
    }
  }
  return null
}

function formatDueLabel(item: WorkItem, now: Date): string | undefined {
  const d = scheduleDate(item)
  if (!d) {
    return undefined
  }
  if (isSameDay(d, startOfDay(now))) {
    return `Today · ${format(d, 'h:mm a')}`
  }
  return format(d, 'EEE · MMM d')
}

function urgencyForItem(item: WorkItem, now: Date): Task['urgency'] {
  const d = scheduleDate(item)
  if (!d) {
    return 'none'
  }
  const today = startOfDay(now)
  const day = startOfDay(d)
  if (day.getTime() < today.getTime()) {
    return 'high'
  }
  if (isSameDay(day, today)) {
    return 'high'
  }
  const inThreeDays = day.getTime() <= startOfDay(now).getTime() + 3 * 86_400_000
  return inThreeDays ? 'medium' : 'low'
}

export function workItemToTask(item: WorkItem, now: Date): Task {
  return {
    id: item.id,
    title: item.title,
    completed: !isOpenWorkItem(item),
    source: 'manual',
    dueDate: formatDueLabel(item, now),
    detail: item.notes ?? undefined,
    urgency: urgencyForItem(item, now),
  }
}

export function workItemsToDashboardTasks(items: WorkItem[], now: Date): Task[] {
  return items.filter(isOpenWorkItem).map((item) => workItemToTask(item, now))
}

function workItemToCalendarEvent(item: WorkItem): CalendarEvent | null {
  if (!item.startAt) {
    return null
  }
  let start: Date
  let end: Date
  try {
    start = parseISO(item.startAt)
    end = item.endAt ? parseISO(item.endAt) : start
  } catch {
    return null
  }
  return {
    id: item.id,
    title: item.title,
    startTime: format(start, 'h:mm a'),
    endTime: format(end, 'h:mm a'),
    location: undefined,
    type: 'meeting',
    status: 'scheduled',
  }
}

export function workItemsToUpcomingEvents(items: WorkItem[], now: Date, days = 3): CalendarEvent[] {
  const today = itemsForToday(items, now)
  const upcoming = itemsUpcomingDays(items, now, days)
  const scheduled = [...today, ...upcoming].filter((item) => item.startAt)
  const seen = new Set<string>()
  const events: CalendarEvent[] = []
  for (const item of scheduled) {
    if (seen.has(item.id)) {
      continue
    }
    seen.add(item.id)
    const ev = workItemToCalendarEvent(item)
    if (ev) {
      events.push(ev)
    }
  }
  return events.slice(0, 8)
}
