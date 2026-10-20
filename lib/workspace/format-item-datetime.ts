import { getDisplayTimeZone } from '@/lib/workspace/display-time-zone'

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

function formatDateOnlyYmd(yyyyMmDd: string): string {
  const parts = yyyyMmDd.split('-').map(Number)
  const y = parts[0]
  const m = parts[1]
  const d = parts[2]
  if (!y || !m || !d) {
    return yyyyMmDd
  }
  const dt = new Date(Date.UTC(y, m - 1, d))
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(dt)
}

/** Due column / read-only item dates — deterministic on server and client. */
export function formatWorkItemDueCell(dueDate: string | null, startAt: string | null): string {
  if (startAt) {
    return formatIsoDateTimeForDisplay(startAt)
  }
  if (!dueDate) {
    return '—'
  }
  if (DATE_ONLY.test(dueDate)) {
    return formatDateOnlyYmd(dueDate)
  }
  try {
    return formatIsoDateTimeForDisplay(dueDate)
  } catch {
    return dueDate
  }
}

export function formatIsoDateTimeForDisplay(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return new Intl.DateTimeFormat('en-US', {
    timeZone: getDisplayTimeZone(),
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

/** Date-only custom fields (yyyy-MM-dd in data json). */
export function formatFieldDateForDisplay(value: string): string {
  if (DATE_ONLY.test(value)) {
    return formatDateOnlyYmd(value)
  }
  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return value
    }
    return new Intl.DateTimeFormat('en-US', {
      timeZone: getDisplayTimeZone(),
      month: 'short',
      day: 'numeric',
    }).format(date)
  } catch {
    return value
  }
}
