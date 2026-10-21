import { parseQuickAdd } from '@/lib/workspace/parse-quick-add'
import { quickAddParseToCreatePayload } from '@/lib/workspace/quick-add-submit'

export type BrainDumpSegmentKind = 'task' | 'calendar_event' | 'note'

export type BrainDumpSegment = {
  kind: BrainDumpSegmentKind
  raw: string
  title: string
  /** Present for calendar_event segments (timed start_at on work_item). */
  startAt: string | null
  endAt: string | null
  allDay: boolean
  dueDate: string | null
}

const LOOSE_THOUGHT =
  /\b(i always|i keep|i never|i'm always|im always|worried about|feel like|just thinking|on my mind)\b/i

const ACTIONABLE =
  /\b(i need to|i have to|i've got to|i got to|need to|have to|must|should|go to|meet|call|buy|get|finish|submit|send|pick up)\b/i

/** Split a brain dump into clauses (lines, semicolons, "and I need to…"). */
export function splitBrainDumpClauses(text: string): string[] {
  const trimmed = text.trim()
  if (!trimmed) {
    return []
  }

  const parts = trimmed
    .split(
      /\r?\n|;|(?:\band\b\s+(?=(?:i\s+(?:need|have|want|got)|(?:need|have)\s+to)))/i
    )
    .map((s) => s.trim())
    .filter(Boolean)

  return parts.length > 0 ? parts : [trimmed]
}

/** Strip leading "I need to do/have to …" phrasing for titles and chrono parsing. */
export function stripBrainDumpActionPrefix(clause: string): string {
  return clause
    .replace(/^i\s+(?:need|have|got|'ve got)\s+to\s+(?:do\s+)?/i, '')
    .replace(/^i\s+(?:need|have|got|'ve got)\s+to\s+/i, '')
    .replace(/^(?:need|have)\s+to\s+(?:do\s+)?/i, '')
    .trim()
}

function isLooseThought(clause: string): boolean {
  const lower = clause.toLowerCase()
  if (ACTIONABLE.test(lower)) {
    return false
  }
  if (LOOSE_THOUGHT.test(lower)) {
    return true
  }
  return !ACTIONABLE.test(lower) && clause.split(/\s+/).length >= 3
}

function classifyClause(clause: string, now: Date): BrainDumpSegment {
  const raw = clause.trim()
  if (!raw) {
    return {
      kind: 'note',
      raw: '',
      title: '',
      startAt: null,
      endAt: null,
      allDay: false,
      dueDate: null,
    }
  }

  if (isLooseThought(raw)) {
    return {
      kind: 'note',
      raw,
      title: raw,
      startAt: null,
      endAt: null,
      allDay: false,
      dueDate: null,
    }
  }

  const forQuickAdd = stripBrainDumpActionPrefix(raw)
  const parsed = parseQuickAdd(forQuickAdd.length > 0 ? forQuickAdd : raw, now)
  const payload = quickAddParseToCreatePayload(parsed)

  if (payload.startAt) {
    return {
      kind: 'calendar_event',
      raw,
      title: payload.title,
      startAt: payload.startAt,
      endAt: payload.endAt ?? null,
      allDay: false,
      dueDate: null,
    }
  }

  const title = payload.title.trim() || stripBrainDumpActionPrefix(raw) || raw
  return {
    kind: 'task',
    raw,
    title,
    startAt: null,
    endAt: null,
    allDay: payload.allDay ?? false,
    dueDate: payload.dueDate ?? null,
  }
}

/** Pure parse: brain dump text → segments (uses chrono quick-add, same as command-bar create). */
export function parseBrainDump(text: string, now: Date): BrainDumpSegment[] {
  return splitBrainDumpClauses(text)
    .map((clause) => classifyClause(clause, now))
    .filter((s) => s.title.length > 0)
}
