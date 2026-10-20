import 'server-only'

import { addDays, subDays } from 'date-fns'
import { google } from 'googleapis'

import {
  getCalendarConnectionForSpace,
  markCalendarConnectionSynced,
  type CalendarConnection,
} from '@/lib/db/calendar-connections'
import type { DbClient } from '@/lib/db/db-client'
import {
  applyCalendarImportBatch,
  listExistingImportExternalIds,
} from '@/lib/db/items'
import { scheduleAdaptation } from '@/lib/adaptation/schedule-adaptation'

import { IMPORT_WINDOW_DAYS } from './google-calendar/constants'
import {
  dedupeMappedCalendarItems,
  mapGoogleCalendarEventToImportItem,
  partitionCalendarImportItems,
  type GoogleCalendarEventInput,
} from './google-calendar/map-event'
import { refreshAccessTokenIfNeeded } from './google-calendar/token-refresh'

export type CalendarImportResult = {
  importedCount: number
  createdCount: number
  updatedCount: number
}

export async function runGoogleCalendarImportForConnection(
  client: DbClient,
  connection: CalendarConnection
): Promise<CalendarImportResult> {
  const { connection: fresh, oauth } = await refreshAccessTokenIfNeeded(client, connection)
  const calendar = google.calendar({ version: 'v3', auth: oauth })

  const now = new Date()
  const timeMin = subDays(now, IMPORT_WINDOW_DAYS).toISOString()
  const timeMax = addDays(now, IMPORT_WINDOW_DAYS).toISOString()

  const events: GoogleCalendarEventInput[] = []
  let pageToken: string | undefined

  do {
    const res = await calendar.events.list({
      calendarId: fresh.calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250,
      pageToken,
    })
    for (const item of res.data.items ?? []) {
      events.push(item as GoogleCalendarEventInput)
    }
    pageToken = res.data.nextPageToken ?? undefined
  } while (pageToken)

  const mapped = dedupeMappedCalendarItems(
    events
      .map(mapGoogleCalendarEventToImportItem)
      .filter((row): row is NonNullable<typeof row> => row !== null)
  )

  const existing = await listExistingImportExternalIds(
    client,
    fresh.workspaceId,
    fresh.spaceId
  )
  const { creates, updates } = partitionCalendarImportItems(mapped, existing)

  const { createdCount, updatedCount } = await applyCalendarImportBatch(
    client,
    fresh.workspaceId,
    fresh.spaceId,
    creates,
    updates
  )

  const syncedAt = new Date().toISOString()
  await markCalendarConnectionSynced(client, fresh.workspaceId, fresh.id, syncedAt)
  scheduleAdaptation(client, fresh.workspaceId)

  return {
    importedCount: mapped.length,
    createdCount,
    updatedCount,
  }
}

export async function runGoogleCalendarImportForSpace(
  client: DbClient,
  workspaceId: string,
  spaceId: string
): Promise<CalendarImportResult> {
  const connection = await getCalendarConnectionForSpace(client, workspaceId, spaceId)
  if (!connection) {
    throw new Error('No Google Calendar connection for this space.')
  }
  return runGoogleCalendarImportForConnection(client, connection)
}
