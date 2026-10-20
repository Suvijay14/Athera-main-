import { parseISO, startOfDay } from 'date-fns'

import type { WorkItem } from '@/lib/db/schemas'

export type EntityRhythmResult = {
  typicalGapDays: number | null
  lastActivityAt: Date | null
  hasFutureItems: boolean
  datedItemCount: number
}

/** Best available schedule/completion date for rhythm (spec order). */
export function pickItemRhythmDate(item: WorkItem): Date | null {
  if (item.startAt?.trim()) {
    return parseISO(item.startAt)
  }
  if (item.dueDate?.trim()) {
    return parseISO(`${item.dueDate}T12:00:00.000Z`)
  }
  if (item.completedAt?.trim()) {
    return parseISO(item.completedAt)
  }
  return null
}

function median(values: number[]): number | null {
  if (values.length === 0) {
    return null
  }
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 1) {
    return sorted[mid]!
  }
  return (sorted[mid - 1]! + sorted[mid]!) / 2
}

/**
 * @param entityId unused today — callers pass items already scoped to the entity.
 */
export function computeEntityRhythm(
  _entityId: string,
  items: WorkItem[],
  now: Date
): EntityRhythmResult {
  const todayStart = startOfDay(now)
  let hasFutureItems = false
  const dated: Date[] = []
  let lastCreated: Date | null = null
  let lastCompleted: Date | null = null

  for (const item of items) {
    if (item.archivedAt) {
      continue
    }
    const created = parseISO(item.createdAt)
    if (!lastCreated || created > lastCreated) {
      lastCreated = created
    }
    if (item.completedAt?.trim()) {
      const completed = parseISO(item.completedAt)
      if (!lastCompleted || completed > lastCompleted) {
        lastCompleted = completed
      }
    }

    const picked = pickItemRhythmDate(item)
    if (!picked) {
      continue
    }
    dated.push(picked)
    if (startOfDay(picked) >= todayStart) {
      hasFutureItems = true
    }
  }

  const pastDates = dated.filter((d) => startOfDay(d) < todayStart)
  const sortedPast = [...pastDates].sort((a, b) => a.getTime() - b.getTime())
  const gaps: number[] = []
  for (let i = 1; i < sortedPast.length; i++) {
    const days = (sortedPast[i]!.getTime() - sortedPast[i - 1]!.getTime()) / (1000 * 60 * 60 * 24)
    gaps.push(days)
  }
  const typicalGapDays = gaps.length >= 1 ? median(gaps) : null

  let lastPastItemDate: Date | null = null
  if (sortedPast.length > 0) {
    lastPastItemDate = sortedPast[sortedPast.length - 1]!
  }

  const candidates: Date[] = []
  if (lastPastItemDate) {
    candidates.push(lastPastItemDate)
  }
  if (lastCreated) {
    candidates.push(lastCreated)
  }
  if (lastCompleted) {
    candidates.push(lastCompleted)
  }

  const lastActivityAt =
    candidates.length === 0 ? null : new Date(Math.max(...candidates.map((d) => d.getTime())))

  return {
    typicalGapDays,
    lastActivityAt,
    hasFutureItems,
    datedItemCount: dated.length,
  }
}
