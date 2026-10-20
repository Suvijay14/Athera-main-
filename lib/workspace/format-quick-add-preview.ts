import { format } from 'date-fns'

import type { QuickAddParseResult } from '@/lib/workspace/parse-quick-add'

export function formatQuickAddPreview(parsed: QuickAddParseResult): string | null {
  if (parsed.allDay && parsed.dueDate) {
    try {
      const d = new Date(`${parsed.dueDate}T12:00:00`)
      return `📅 ${format(d, 'EEE, MMM d')} · All day`
    } catch {
      return `📅 ${parsed.dueDate} · All day`
    }
  }
  if (parsed.startAt) {
    const start = format(parsed.startAt, 'EEE, MMM d · h:mmaaa')
    if (parsed.endAt) {
      const end = format(parsed.endAt, 'h:mmaaa')
      return `📅 ${start} – ${end}`
    }
    return `📅 ${start}`
  }
  return null
}
