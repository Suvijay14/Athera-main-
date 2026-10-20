import { addMinutes, format, parseISO } from 'date-fns'
import { RRule } from 'rrule'

import type { RecurrenceRule } from '@/lib/db/schemas'

import type { RecurrenceInstance } from './recurrence-types'
import { virtualRecurrenceId } from './recurrence-types'

/** IANA zone for recurrence local time (spec: local time survives DST). */
export const RECURRENCE_TIMEZONE = 'America/Los_Angeles'

function exceptionSet(rule: RecurrenceRule): Set<string> {
  return new Set(rule.exceptions)
}

function rruleWeekdayFromJs(day: number): typeof RRule.MO {
  const map = [RRule.SU, RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA] as const
  return map[day] ?? RRule.MO
}

function localDateTimeParts(isoDate: string, timeOfDay: string | null): { y: number; m: number; d: number; h: number; min: number } {
  const [y, m, d] = isoDate.split('-').map(Number)
  if (timeOfDay) {
    const [h, min] = timeOfDay.split(':').map(Number)
    return { y: y!, m: m!, d: d!, h: h!, min: min! }
  }
  return { y: y!, m: m!, d: d!, h: 12, min: 0 }
}

function instanceStartIso(instanceDate: string, timeOfDay: string | null): string {
  const { y, m, d, h, min } = localDateTimeParts(instanceDate, timeOfDay)
  const dt = new Date(Date.UTC(y, m - 1, d, h, min))
  return dt.toISOString()
}

function buildRRule(rule: RecurrenceRule): RRule {
  const [sy, sm, sd] = rule.startsOn.split('-').map(Number)
  const dtstart = new Date(Date.UTC(sy!, sm! - 1, sd!, 12, 0, 0))
  const byweekday = rule.byWeekday.map((d) => rruleWeekdayFromJs(d))
  return new RRule({
    freq: RRule.WEEKLY,
    interval: rule.intervalCount,
    byweekday,
    dtstart,
    until: rule.endsOn
      ? (() => {
          const [ey, em, ed] = rule.endsOn.split('-').map(Number)
          return new Date(Date.UTC(ey!, em! - 1, ed!, 23, 59, 59))
        })()
      : undefined,
  })
}

export function generateInstances(
  rule: RecurrenceRule,
  rangeStart: Date,
  rangeEnd: Date
): RecurrenceInstance[] {
  if (!rule.active) {
    return []
  }
  const exceptions = exceptionSet(rule)
  const rrule = buildRRule(rule)
  const dates = rrule.between(rangeStart, rangeEnd, true)
  const template = rule.templateItem
  const title = typeof template.title === 'string' ? template.title : 'Untitled'
  const notes =
    typeof template.notes === 'string' ? template.notes : template.notes === null ? null : null
  const data =
    typeof template.data === 'object' && template.data !== null && !Array.isArray(template.data)
      ? (template.data as Record<string, unknown>)
      : {}
  const allDay = template.allDay === true || !rule.timeOfDay

  const out: RecurrenceInstance[] = []
  for (const dt of dates) {
    const instanceDate = format(dt, 'yyyy-MM-dd')
    if (exceptions.has(instanceDate)) {
      continue
    }
    if (instanceDate < rule.startsOn) {
      continue
    }
    if (rule.endsOn && instanceDate > rule.endsOn) {
      continue
    }

    let startAt: string | null = null
    let endAt: string | null = null
    let dueDate: string | null = null

    if (allDay) {
      dueDate = instanceDate
    } else if (rule.timeOfDay) {
      startAt = instanceStartIso(instanceDate, rule.timeOfDay)
      if (rule.durationMin) {
        endAt = addMinutes(parseISO(startAt), rule.durationMin).toISOString()
      }
    } else {
      dueDate = instanceDate
    }

    out.push({
      recurrenceId: rule.id,
      instanceDate,
      virtualId: virtualRecurrenceId(rule.id, instanceDate),
      title,
      notes,
      data,
      dueDate,
      startAt,
      endAt,
      allDay,
      spaceId: rule.spaceId,
    })
  }
  return out
}

export function formatRecurrenceLabel(rule: RecurrenceRule): string {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const days = rule.byWeekday.map((d) => dayNames[d] ?? '?').join(', ')
  const every = rule.intervalCount === 2 ? 'Every 2 wks' : 'Every'
  const time = rule.timeOfDay ? ` · ${rule.timeOfDay}` : ''
  return `${every} ${days}${time}`.trim()
}
