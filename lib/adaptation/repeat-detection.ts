import { addDays, addWeeks, differenceInCalendarDays, format, getDay, parseISO, startOfDay, subWeeks } from 'date-fns'

import type { FieldDefinition, RecurrenceRule, WorkItem } from '@/lib/db/schemas'
import { generateInstances } from '@/lib/workspace/recurrence'
import { entityFieldKeys } from '@/lib/workspace/entity-items'
import { normalizeRepeatTitle } from '@/lib/workspace/normalize-repeat-title'
import type { RecurrenceRule as RuleForGen } from '@/lib/db/schemas'

import type { Operation } from './types'

const LOOKBACK_WEEKS = 8
const RECENT_DAYS = 14
const TIME_TOLERANCE_MIN = 30

export type RepeatPatternMatch = {
  spaceId: string
  entityId: string | null
  normalizedTitle: string
  items: WorkItem[]
  intervalCount: 1 | 2
  byWeekday: number[]
  timeOfDay: string | null
  durationMin: number | null
  confidence: number
  projectedDates: string[]
  operations: Operation[]
  dedupeKey: string
  reason: string
}

function itemScheduleDate(item: WorkItem): Date | null {
  if (item.startAt?.trim()) {
    return parseISO(item.startAt)
  }
  if (item.dueDate?.trim()) {
    return parseISO(`${item.dueDate}T12:00:00.000Z`)
  }
  return null
}

function minutesFromMidnight(d: Date): number {
  return d.getUTCHours() * 60 + d.getUTCMinutes()
}

function formatTimeLocal(d: Date): string {
  return format(d, 'HH:mm')
}

function dayName(d: number): string {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d] ?? 'day'
}

function confidenceForCount(n: number): number {
  if (n >= 5) {
    return 0.95
  }
  if (n === 4) {
    return 0.9
  }
  return 0.8
}

function gapsAllowPattern(sortedDates: Date[], intervalDays: 7 | 14): boolean {
  if (sortedDates.length < 2) {
    return false
  }
  let misses = 0
  for (let i = 1; i < sortedDates.length; i++) {
    const gap = differenceInCalendarDays(sortedDates[i]!, sortedDates[i - 1]!)
    if (gap === intervalDays) {
      continue
    }
    if (gap === intervalDays * 2) {
      misses += 1
      if (misses > 1) {
        return false
      }
      continue
    }
    return false
  }
  return true
}

function ruleCoversPattern(
  rules: RecurrenceRule[],
  spaceId: string,
  normalizedTitle: string,
  group: WorkItem[]
): boolean {
  if (group.some((item) => item.recurrenceId)) {
    return true
  }
  for (const rule of rules) {
    if (!rule.active || rule.spaceId !== spaceId) {
      continue
    }
    const tTitle =
      typeof rule.templateItem.title === 'string'
        ? normalizeRepeatTitle(rule.templateItem.title)
        : ''
    if (tTitle === normalizedTitle) {
      return true
    }
  }
  return false
}

function groupKey(spaceId: string, entityId: string | null, normTitle: string): string {
  return `${spaceId}:${entityId ?? 'none'}:${normTitle}`
}

export function detectRepeatPatterns(input: {
  items: WorkItem[]
  fields: FieldDefinition[]
  recurrenceRules: RecurrenceRule[]
  now: Date
}): RepeatPatternMatch | null {
  const entityKeys = entityFieldKeys(input.fields)
  const cutoff = subWeeks(input.now, LOOKBACK_WEEKS)
  const recentCutoff = subWeeks(input.now, 0)
  void recentCutoff
  const recentLimit = addDays(input.now, -RECENT_DAYS)

  const candidates = input.items.filter((item) => {
    if (item.source !== 'manual') {
      return false
    }
    if (item.recurrenceId) {
      return false
    }
    if (item.archivedAt) {
      return false
    }
    const created = parseISO(item.createdAt)
    if (created < cutoff) {
      return false
    }
    return true
  })

  const groups = new Map<string, WorkItem[]>()
  for (const item of candidates) {
    const norm = normalizeRepeatTitle(item.title)
    if (!norm) {
      continue
    }
    let entityId: string | null = null
    for (const key of entityKeys) {
      const val = item.data[key]
      if (typeof val === 'string' && val.length > 0) {
        entityId = val
        break
      }
    }
    const key = groupKey(item.spaceId, entityId, norm)
    const list = groups.get(key) ?? []
    list.push(item)
    groups.set(key, list)
  }

  let best: RepeatPatternMatch | null = null

  for (const [, group] of groups) {
    if (group.length < 3) {
      continue
    }
    const withDates = group
      .map((item) => ({ item, date: itemScheduleDate(item) }))
      .filter((x): x is { item: WorkItem; date: Date } => x.date !== null)
    if (withDates.length < 3) {
      continue
    }
    const sorted = [...withDates].sort((a, b) => a.date.getTime() - b.date.getTime())
    const mostRecent = sorted[sorted.length - 1]!
    if (mostRecent.date < recentLimit) {
      continue
    }

    const weekdays = sorted.map((x) => getDay(x.date))
    const uniqueDays = [...new Set(weekdays)]
    if (uniqueDays.length > 2) {
      continue
    }
    if (uniqueDays.length === 2) {
      const okPair =
        (uniqueDays.includes(2) && uniqueDays.includes(4)) ||
        (uniqueDays.every((d) => weekdays.filter((w) => w === d).length >= 2))
      if (!okPair && uniqueDays.length === 2) {
        const allSameTwo = weekdays.every((w) => uniqueDays.includes(w))
        if (!allSameTwo) {
          continue
        }
      }
    } else if (uniqueDays.length === 1) {
      /* single weekday — good */
    }

    const timed = sorted.filter((x) => Boolean(x.item.startAt?.trim()))
    let timeOfDay: string | null = null
    let durationMin: number | null = null
    if (timed.length > 0) {
      if (timed.length < sorted.length && timed.length < 3) {
        continue
      }
      const mins = timed.map((x) => minutesFromMidnight(x.date))
      const base = mins[0]!
      if (!mins.every((m) => Math.abs(m - base) <= TIME_TOLERANCE_MIN)) {
        continue
      }
      timeOfDay = formatTimeLocal(timed[0]!.date)
      const end = timed[0]!.item.endAt
      if (end?.trim() && timed[0]!.item.startAt) {
        durationMin = Math.round(
          (parseISO(end).getTime() - parseISO(timed[0]!.item.startAt).getTime()) / 60_000
        )
      }
    } else if (!sorted.every((x) => x.item.dueDate && !x.item.startAt)) {
      /* date-only ok */
    }

    const datesOnly = sorted.map((x) => startOfDay(x.date))
    let intervalCount: 1 | 2 = 1
    if (gapsAllowPattern(datesOnly, 14)) {
      intervalCount = 2
    } else if (!gapsAllowPattern(datesOnly, 7)) {
      continue
    }

    const sample = mostRecent.item
    const norm = normalizeRepeatTitle(sample.title)
    let entityId: string | null = null
    for (const key of entityKeys) {
      const val = sample.data[key]
      if (typeof val === 'string') {
        entityId = val
      }
    }

    if (ruleCoversPattern(input.recurrenceRules, sample.spaceId, norm, group)) {
      continue
    }

    const byWeekday = uniqueDays.length === 2 ? uniqueDays.sort((a, b) => a - b) : [uniqueDays[0]!]
    const startsOn = format(sorted[0]!.date, 'yyyy-MM-dd')

    const hypotheticalRule: RuleForGen = {
      id: '00000000-0000-4000-8000-000000000099',
      workspaceId: sample.workspaceId,
      spaceId: sample.spaceId,
      templateItem: {
        title: sample.title,
        notes: sample.notes,
        data: sample.data,
      },
      freq: 'weekly',
      intervalCount,
      byWeekday,
      timeOfDay,
      durationMin,
      startsOn,
      endsOn: null,
      exceptions: [],
      active: true,
      source: 'athera',
      createdAt: sample.createdAt,
    }

    const projected = generateInstances(
      hypotheticalRule,
      startOfDay(input.now),
      addWeeks(startOfDay(input.now), 8)
    )
      .slice(0, 4)
      .map((i) => i.instanceDate)

    const dedupeKey = entityId
      ? `repeat:${sample.spaceId}:${entityId}:${norm}`
      : `repeat:${sample.spaceId}:${norm}`

    const weekdayLabel = byWeekday.map((d) => dayName(d)).join(' & ')
    const timeLabel = timeOfDay ? ` at ${timeOfDay}` : ''
    const reason = `${sample.title} is every ${weekdayLabel}${timeLabel}. Make it repeat?`

    const match: RepeatPatternMatch = {
      spaceId: sample.spaceId,
      entityId,
      normalizedTitle: norm,
      items: group,
      intervalCount,
      byWeekday,
      timeOfDay,
      durationMin,
      confidence: confidenceForCount(group.length),
      projectedDates: projected,
      dedupeKey,
      reason,
      operations: [
        {
          op: 'create_recurrence_rule',
          rule: {
            spaceId: sample.spaceId,
            templateItem: {
              title: sample.title,
              notes: sample.notes,
              data: sample.data,
            },
            freq: 'weekly',
            intervalCount,
            byWeekday,
            timeOfDay,
            durationMin,
            startsOn,
            endsOn: null,
            exceptions: [],
            linkItemIds: group.map((i) => i.id),
          },
        },
      ],
    }

    if (!best || match.confidence > best.confidence) {
      best = match
    }
  }

  return best
}
