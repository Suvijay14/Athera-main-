const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

export function repeatPatternHeadline(
  title: string,
  byWeekday: number[],
  timeLabel: string | null
): string {
  const days =
    byWeekday.length === 1
      ? `${WEEKDAY_NAMES[byWeekday[0]!] ?? 'week'}`
      : byWeekday.map((d) => WEEKDAY_NAMES[d] ?? 'day').join(' & ')
  const timePart = timeLabel ? ` at ${timeLabel}` : ''
  return `${title} is every ${days}${timePart}. Make it repeat?`
}

export function repeatPatternReasoningLine(count: number, byWeekday: number[]): string {
  const day =
    byWeekday.length === 1
      ? `${WEEKDAY_NAMES[byWeekday[0]!] ?? 'week'}s`
      : 'those days'
  return `You've added it by hand ${count} ${day} in a row.`
}

export function repeatPatternCta(intervalCount: 1 | 2): string {
  return intervalCount === 2 ? 'Repeat every 2 weeks' : 'Repeat weekly'
}

/** Friendly local time for suggestion copy (e.g. "4pm"). */
export function formatRepeatTimeOfDay(timeOfDay: string | null): string | null {
  if (!timeOfDay?.trim()) {
    return null
  }
  const [hRaw, mRaw] = timeOfDay.split(':')
  const h = Number(hRaw)
  const m = Number(mRaw ?? 0)
  if (Number.isNaN(h)) {
    return timeOfDay
  }
  const d = new Date(2000, 0, 1, h, m)
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: m ? '2-digit' : undefined }).toLowerCase()
}
