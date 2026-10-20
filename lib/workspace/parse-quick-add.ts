import * as chrono from 'chrono-node'
import { addMinutes, format } from 'date-fns'

/** Default timed event length when the user does not specify an end time. */
export const DEFAULT_DURATION_MINUTES = 60

export type QuickAddParseResult = {
  title: string
  startAt: Date | null
  endAt: Date | null
  allDay: boolean
  matchedText: string | null
  /** Set when `allDay` is true — stored as `due_date` on create. */
  dueDate: string | null
}

function stripMatchedPhrase(input: string, index: number, matchedText: string): string {
  const before = input.slice(0, index)
  const after = input.slice(index + matchedText.length)
  return `${before} ${after}`.replace(/\s+/g, ' ').trim()
}

function toDateOnly(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

/**
 * Parses casual date/time phrases from a quick-add line.
 * Synchronous only — no network or LLM.
 */
export function parseQuickAdd(input: string, now: Date): QuickAddParseResult {
  const trimmed = input.trim()
  const empty: QuickAddParseResult = {
    title: '',
    startAt: null,
    endAt: null,
    allDay: false,
    matchedText: null,
    dueDate: null,
  }
  if (!trimmed) {
    return empty
  }

  const results = chrono.parse(trimmed, now, { forwardDate: true })
  if (results.length === 0) {
    return {
      ...empty,
      title: trimmed,
    }
  }

  const match = results[0]!
  const matchedText = match.text
  const title = stripMatchedPhrase(trimmed, match.index, matchedText)
  const resolvedTitle = title.length > 0 ? title : trimmed

  const hasTime = match.start.isCertain('hour')
  if (!hasTime) {
    return {
      title: resolvedTitle,
      startAt: null,
      endAt: null,
      allDay: true,
      matchedText,
      dueDate: toDateOnly(match.start.date()),
    }
  }

  const startAt = match.start.date()
  let endAt: Date
  if (match.end?.isCertain('hour')) {
    endAt = match.end.date()
  } else {
    endAt = addMinutes(startAt, DEFAULT_DURATION_MINUTES)
  }

  return {
    title: resolvedTitle,
    startAt,
    endAt,
    allDay: false,
    matchedText,
    dueDate: null,
  }
}
