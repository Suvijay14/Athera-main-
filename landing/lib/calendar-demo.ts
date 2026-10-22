import type { ComparisonTask } from '@/lib/landing/comparison-demo'

const DAY_PREFIX = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+/i

export const GRID_TIME_LABELS = ['10am', '12pm', '2pm', '4pm', '6pm'] as const
export const GRID_START_MIN = 10 * 60
export const GRID_END_MIN = 18 * 60

export function parseTimeMinutesFromText(text: string): number {
  const withMinutes = text.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i)
  if (withMinutes) {
    let h = parseInt(withMinutes[1], 10)
    const min = parseInt(withMinutes[2], 10)
    const ap = withMinutes[3]?.toLowerCase()
    if (!ap && h >= 1 && h <= 7) h += 12
    else if (ap === 'pm' && h !== 12) h += 12
    else if (ap === 'am' && h === 12) h = 0
    return h * 60 + min
  }
  const simple = text.match(/(\d{1,2})\s*(am|pm)/i)
  if (simple) {
    let h = parseInt(simple[1], 10)
    if (simple[2].toLowerCase() === 'pm' && h !== 12) h += 12
    if (simple[2].toLowerCase() === 'am' && h === 12) h = 0
    return h * 60
  }
  return 12 * 60
}

export function timeToTopPercent(minutes: number): number {
  const clamped = Math.min(GRID_END_MIN, Math.max(GRID_START_MIN, minutes))
  return ((clamped - GRID_START_MIN) / (GRID_END_MIN - GRID_START_MIN)) * 100
}

export function formatTimeShort(timeLabel: string): string {
  const t = timeLabel.trim()
  if (!t) return ''
  return t.replace(DAY_PREFIX, '').replace(/\s+/g, '')
}

export function comparisonCalendarEventLabel(task: ComparisonTask): string {
  const time = formatTimeShort(task.timeLabel || '')
  const parts = task.text.split(' · ').map((p) => p.trim()).filter(Boolean)
  let subject = parts[parts.length - 1] ?? task.text
  subject = subject.replace(DAY_PREFIX, '').trim()
  if (time && subject.toLowerCase().includes(time.toLowerCase())) {
    subject = parts.length >= 2 ? parts[parts.length - 2] : parts[0]
  }
  subject = subject.replace(DAY_PREFIX, '').trim()
  return time ? `${subject} · ${time}` : subject
}

export function heroCalendarEventLabel(cleanTitle: string): string {
  const tutoringPrefix = 'Tutoring · '
  let t = cleanTitle.startsWith(tutoringPrefix) ? cleanTitle.slice(tutoringPrefix.length) : cleanTitle
  const parts = t.split(' · ').map((p) => p.trim()).filter(Boolean)
  const last = parts[parts.length - 1] ?? t
  const timeOnly = last.replace(DAY_PREFIX, '').trim()
  const subject = parts.length >= 2 ? parts[parts.length - 2] : parts[0]
  if (!timeOnly.match(/\d/)) return `${subject} · ${last}`
  return `${subject} · ${timeOnly}`
}
