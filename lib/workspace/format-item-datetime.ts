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
    return 'No date'
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

/** Compact due/time for space list rows (mockup: "Tue 2:00pm", "Fri", "No date"). */
export function formatWorkItemListWhen(
  dueDate: string | null,
  startAt: string | null,
  endAt: string | null
): string {
  if (startAt) {
    const date = new Date(startAt)
    if (Number.isNaN(date.getTime())) {
      return '—'
    }
    const day = new Intl.DateTimeFormat('en-US', {
      timeZone: getDisplayTimeZone(),
      weekday: 'short',
    }).format(date)
    const time = new Intl.DateTimeFormat('en-US', {
      timeZone: getDisplayTimeZone(),
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
      .format(date)
      .replace(':00', '')
      .replace(' AM', 'am')
      .replace(' PM', 'pm')
    return `${day} ${time}`
  }
  if (dueDate && DATE_ONLY.test(dueDate)) {
    const d = new Date(`${dueDate}T12:00:00`)
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      weekday: 'short',
    }).format(d)
  }
  if (!dueDate && !startAt) {
    return 'No date'
  }
  void endAt
  return formatWorkItemDueCell(dueDate, startAt)
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
