import type { QuickAddParseResult } from '@/lib/workspace/parse-quick-add'

export type QuickAddCreatePayload = {
  title: string
  data: Record<string, unknown>
  dueDate?: string | null
  startAt?: string | null
  endAt?: string | null
  allDay?: boolean
}

/** Maps parseQuickAdd output to createWorkItem / quickCreate payload. */
export function quickAddParseToCreatePayload(parsed: QuickAddParseResult): QuickAddCreatePayload {
  const base: QuickAddCreatePayload = {
    title: parsed.title,
    data: {},
  }

  if (parsed.allDay && parsed.dueDate) {
    return { ...base, dueDate: parsed.dueDate, allDay: true }
  }

  if (parsed.startAt) {
    return {
      ...base,
      startAt: parsed.startAt.toISOString(),
      endAt: parsed.endAt?.toISOString() ?? null,
      allDay: false,
    }
  }

  return base
}
