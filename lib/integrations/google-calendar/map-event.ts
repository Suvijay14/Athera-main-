import { GOOGLE_CALENDAR_PROVIDER } from './constants'

/** Subset of Google Calendar API event fields used for import mapping. */
export type GoogleCalendarEventInput = {
  id?: string | null
  summary?: string | null
  description?: string | null
  status?: string | null
  start?: { date?: string | null; dateTime?: string | null } | null
  end?: { date?: string | null; dateTime?: string | null } | null
}

export type MappedCalendarImportItem = {
  externalProvider: typeof GOOGLE_CALENDAR_PROVIDER
  externalId: string
  title: string
  notes: string | null
  startAt: string | null
  endAt: string | null
  dueDate: string | null
  allDay: boolean
  source: 'import'
}

export function calendarEventTitle(summary: string | null | undefined): string {
  const trimmed = summary?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : '(No title)'
}

/**
 * Maps a Google Calendar event to work_item fields.
 * Returns null for cancelled events or events without an id.
 */
export function mapGoogleCalendarEventToImportItem(
  event: GoogleCalendarEventInput
): MappedCalendarImportItem | null {
  if (!event.id?.trim()) {
    return null
  }
  if (event.status === 'cancelled') {
    return null
  }

  const startDate = event.start?.date ?? null
  const startDateTime = event.start?.dateTime ?? null
  const endDateTime = event.end?.dateTime ?? null

  const allDay = Boolean(startDate && !startDateTime)

  if (allDay && startDate) {
    return {
      externalProvider: GOOGLE_CALENDAR_PROVIDER,
      externalId: event.id.trim(),
      title: calendarEventTitle(event.summary),
      notes: event.description?.trim() || null,
      startAt: null,
      endAt: null,
      dueDate: startDate,
      allDay: true,
      source: 'import',
    }
  }

  if (startDateTime) {
    return {
      externalProvider: GOOGLE_CALENDAR_PROVIDER,
      externalId: event.id.trim(),
      title: calendarEventTitle(event.summary),
      notes: event.description?.trim() || null,
      startAt: startDateTime,
      endAt: endDateTime ?? null,
      dueDate: null,
      allDay: false,
      source: 'import',
    }
  }

  return null
}

export type ExistingImportKey = {
  externalId: string
  itemId: string
}

export type ImportPartition = {
  creates: MappedCalendarImportItem[]
  updates: Array<{ itemId: string; patch: MappedCalendarImportItem }>
}

/** Last row wins when Google returns duplicate ids in one batch. */
export function dedupeMappedCalendarItems(
  mapped: MappedCalendarImportItem[]
): MappedCalendarImportItem[] {
  const byExternal = new Map<string, MappedCalendarImportItem>()
  for (const row of mapped) {
    byExternal.set(row.externalId, row)
  }
  return [...byExternal.values()]
}

/** Splits mapped rows into creates vs updates by external id. */
export function partitionCalendarImportItems(
  mapped: MappedCalendarImportItem[],
  existing: ExistingImportKey[]
): ImportPartition {
  const rows = dedupeMappedCalendarItems(mapped)
  const byExternal = new Map(existing.map((e) => [e.externalId, e.itemId]))
  const creates: MappedCalendarImportItem[] = []
  const updates: ImportPartition['updates'] = []

  for (const row of rows) {
    const itemId = byExternal.get(row.externalId)
    if (itemId) {
      updates.push({ itemId, patch: row })
    } else {
      creates.push(row)
    }
  }

  return { creates, updates }
}
