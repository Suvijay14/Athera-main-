import { z } from 'zod'

import type { DbClient } from './db-client'
import { wrapSupabaseError } from './errors'

const calendarConnectionRowSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  space_id: z.string().uuid(),
  provider: z.literal('google'),
  access_token: z.string(),
  refresh_token: z.string().nullable(),
  token_expires_at: z.string().nullable(),
  calendar_id: z.string(),
  last_synced_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type CalendarConnection = {
  id: string
  workspaceId: string
  spaceId: string
  provider: 'google'
  accessToken: string
  refreshToken: string | null
  tokenExpiresAt: string | null
  calendarId: string
  lastSyncedAt: string | null
  createdAt: string
  updatedAt: string
}

/** Safe to pass to client components (no tokens). */
export type CalendarConnectionSummary = {
  id: string
  spaceId: string
  provider: 'google'
  calendarId: string
  lastSyncedAt: string | null
}

export function toCalendarConnectionSummary(
  connection: CalendarConnection
): CalendarConnectionSummary {
  return {
    id: connection.id,
    spaceId: connection.spaceId,
    provider: connection.provider,
    calendarId: connection.calendarId,
    lastSyncedAt: connection.lastSyncedAt,
  }
}

function mapRow(row: z.infer<typeof calendarConnectionRowSchema>): CalendarConnection {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    spaceId: row.space_id,
    provider: row.provider,
    accessToken: row.access_token,
    refreshToken: row.refresh_token,
    tokenExpiresAt: row.token_expires_at,
    calendarId: row.calendar_id,
    lastSyncedAt: row.last_synced_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listCalendarConnectionsForWorkspace(
  client: DbClient,
  workspaceId: string
): Promise<CalendarConnectionSummary[]> {
  const { data, error } = await client
    .from('calendar_connections')
    .select('id, space_id, provider, calendar_id, last_synced_at')
    .eq('workspace_id', workspaceId)

  if (error) {
    throw wrapSupabaseError('Failed to list calendar connections', error)
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    spaceId: row.space_id as string,
    provider: 'google' as const,
    calendarId: row.calendar_id as string,
    lastSyncedAt: (row.last_synced_at as string | null) ?? null,
  }))
}

export async function getCalendarConnectionForSpace(
  client: DbClient,
  workspaceId: string,
  spaceId: string
): Promise<CalendarConnection | null> {
  const { data, error } = await client
    .from('calendar_connections')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('space_id', spaceId)
    .maybeSingle()

  if (error) {
    throw wrapSupabaseError('Failed to load calendar connection', error)
  }
  if (!data) {
    return null
  }
  return mapRow(calendarConnectionRowSchema.parse(data))
}

export type UpsertCalendarConnectionInput = {
  spaceId: string
  accessToken: string
  refreshToken: string | null
  tokenExpiresAt: string | null
  calendarId?: string
}

export async function upsertCalendarConnection(
  client: DbClient,
  workspaceId: string,
  input: UpsertCalendarConnectionInput
): Promise<CalendarConnection> {
  const { data, error } = await client
    .from('calendar_connections')
    .upsert(
      {
        workspace_id: workspaceId,
        space_id: input.spaceId,
        provider: 'google',
        access_token: input.accessToken,
        refresh_token: input.refreshToken,
        token_expires_at: input.tokenExpiresAt,
        calendar_id: input.calendarId ?? 'primary',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'workspace_id,space_id' }
    )
    .select('*')
    .single()

  if (error) {
    throw wrapSupabaseError('Failed to save calendar connection', error)
  }
  return mapRow(calendarConnectionRowSchema.parse(data))
}

export async function updateCalendarConnectionTokens(
  client: DbClient,
  workspaceId: string,
  connectionId: string,
  patch: {
    accessToken: string
    refreshToken: string | null
    tokenExpiresAt: string | null
  }
): Promise<CalendarConnection> {
  const { data, error } = await client
    .from('calendar_connections')
    .update({
      access_token: patch.accessToken,
      refresh_token: patch.refreshToken,
      token_expires_at: patch.tokenExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('workspace_id', workspaceId)
    .eq('id', connectionId)
    .select('*')
    .single()

  if (error) {
    throw wrapSupabaseError('Failed to update calendar tokens', error)
  }
  return mapRow(calendarConnectionRowSchema.parse(data))
}

export async function markCalendarConnectionSynced(
  client: DbClient,
  workspaceId: string,
  connectionId: string,
  syncedAt: string
): Promise<void> {
  const { error } = await client
    .from('calendar_connections')
    .update({ last_synced_at: syncedAt, updated_at: syncedAt })
    .eq('workspace_id', workspaceId)
    .eq('id', connectionId)

  if (error) {
    throw wrapSupabaseError('Failed to update last sync time', error)
  }
}

export async function deleteCalendarConnection(
  client: DbClient,
  workspaceId: string,
  spaceId: string
): Promise<CalendarConnection | null> {
  const existing = await getCalendarConnectionForSpace(client, workspaceId, spaceId)
  if (!existing) {
    return null
  }
  const { error } = await client
    .from('calendar_connections')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('space_id', spaceId)

  if (error) {
    throw wrapSupabaseError('Failed to delete calendar connection', error)
  }
  return existing
}
