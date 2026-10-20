import { addDays, format, isSameDay, parseISO, startOfDay } from 'date-fns'

import type { Space, WorkItem } from '@/lib/db/schemas'

export function timeOfDayGreeting(now: Date): string {
  const hour = now.getHours()
  if (hour < 12) {
    return 'Good morning'
  }
  if (hour < 17) {
    return 'Good afternoon'
  }
  return 'Good evening'
}

function itemScheduleDate(item: WorkItem): Date | null {
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

export function isItemDueOrOverdue(item: WorkItem, today: Date): boolean {
  const d = itemScheduleDate(item)
  if (!d) {
    return false
  }
  return startOfDay(d).getTime() <= startOfDay(today).getTime()
}

export function countNeedsAttentionToday(items: WorkItem[], now: Date): number {
  const today = startOfDay(now)
  return items.filter((item) => isItemDueOrOverdue(item, today)).length
}

export function itemsForToday(items: WorkItem[], now: Date): WorkItem[] {
  const today = startOfDay(now)
  return items
    .filter((item) => {
      const d = itemScheduleDate(item)
      return d !== null && isSameDay(d, today)
    })
    .sort((a, b) => {
      const da = itemScheduleDate(a)?.getTime() ?? 0
      const db = itemScheduleDate(b)?.getTime() ?? 0
      return da - db
    })
}

export function itemsUpcomingDays(items: WorkItem[], now: Date, days: number): WorkItem[] {
  const today = startOfDay(now)
  const end = addDays(today, days)
  return items
    .filter((item) => {
      const d = itemScheduleDate(item)
      if (!d) {
        return false
      }
      const day = startOfDay(d)
      return day.getTime() > today.getTime() && day.getTime() <= end.getTime()
    })
    .sort((a, b) => {
      const da = itemScheduleDate(a)?.getTime() ?? 0
      const db = itemScheduleDate(b)?.getTime() ?? 0
      return da - db
    })
}

export function isOpenWorkItem(item: WorkItem): boolean {
  return !item.archivedAt && !item.completedAt
}

export type SpaceOverviewCard = {
  space: Space
  openCount: number
  /** e.g. "Next: Site review · 2pm" */
  nextLabel: string | null
}

export function formatSpaceNextWhen(item: WorkItem, now: Date): string {
  const d = itemScheduleDate(item)
  if (!d) {
    return '—'
  }
  if (isSameDay(d, startOfDay(now))) {
    return format(d, 'h:mm a')
  }
  return format(d, 'EEE · h:mm a')
}

export function buildSpaceNextLabel(item: WorkItem, now: Date): string {
  return `Next: ${item.title} · ${formatSpaceNextWhen(item, now)}`
}

export function buildSpaceOverviewCards(
  spaces: Space[],
  items: WorkItem[],
  now: Date
): SpaceOverviewCard[] {
  const today = startOfDay(now)
  return spaces.map((space) => {
    const inSpace = items.filter((i) => i.spaceId === space.id)
    const openCount = inSpace.filter(isOpenWorkItem).length
    const upcoming = inSpace
      .filter(isOpenWorkItem)
      .map((item) => ({ item, at: itemScheduleDate(item) }))
      .filter((row): row is { item: WorkItem; at: Date } => row.at !== null && row.at >= today)
      .sort((a, b) => a.at.getTime() - b.at.getTime())
    const next = upcoming[0]?.item
    return {
      space,
      openCount,
      nextLabel: next ? buildSpaceNextLabel(next, now) : null,
    }
  })
}

export function countOverviewNeedYou(
  items: WorkItem[],
  now: Date,
  hasPendingSuggestion: boolean
): number {
  return countNeedsAttentionToday(items, now) + (hasPendingSuggestion ? 1 : 0)
}

export function formatOverviewDateLine(now: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(now)
}

export function formatOverviewWhen(item: WorkItem): string {
  const d = itemScheduleDate(item)
  if (!d) {
    return '—'
  }
  return format(d, 'EEE · h:mm a')
}
