import { z } from 'zod'

const isoDateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const recurrenceFreqSchema = z.literal('weekly')

export const recurrenceTemplateItemSchema = z.object({
  title: z.string().min(1),
  notes: z.string().nullable().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  dueDate: isoDateString.nullable().optional(),
  startAt: z.string().nullable().optional(),
  endAt: z.string().nullable().optional(),
  allDay: z.boolean().optional(),
})

export type RecurrenceTemplateItem = z.infer<typeof recurrenceTemplateItemSchema>

export type RecurrenceInstance = {
  recurrenceId: string
  instanceDate: string
  virtualId: string
  title: string
  notes: string | null
  data: Record<string, unknown>
  dueDate: string | null
  startAt: string | null
  endAt: string | null
  allDay: boolean
  spaceId: string
}

export function virtualRecurrenceId(recurrenceId: string, instanceDate: string): string {
  return `recurrence:${recurrenceId}:${instanceDate}`
}

export function parseVirtualRecurrenceId(
  id: string
): { recurrenceId: string; instanceDate: string } | null {
  if (!id.startsWith('recurrence:')) {
    return null
  }
  const rest = id.slice('recurrence:'.length)
  const sep = rest.indexOf(':')
  if (sep <= 0) {
    return null
  }
  const recurrenceId = rest.slice(0, sep)
  const instanceDate = rest.slice(sep + 1)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(instanceDate)) {
    return null
  }
  return { recurrenceId, instanceDate }
}
