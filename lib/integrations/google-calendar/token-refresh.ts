import 'server-only'

import type { OAuth2Client } from 'google-auth-library'

import type { CalendarConnection } from '@/lib/db/calendar-connections'
import { updateCalendarConnectionTokens } from '@/lib/db/calendar-connections'
import type { DbClient } from '@/lib/db/db-client'

import { createCalendarOAuthClient } from './oauth-client'

const REFRESH_BUFFER_MS = 60_000

export function applyTokensToOAuthClient(
  oauth: OAuth2Client,
  connection: CalendarConnection
): void {
  oauth.setCredentials({
    access_token: connection.accessToken,
    refresh_token: connection.refreshToken ?? undefined,
    expiry_date: connection.tokenExpiresAt
      ? new Date(connection.tokenExpiresAt).getTime()
      : undefined,
  })
}

export async function refreshAccessTokenIfNeeded(
  db: DbClient,
  connection: CalendarConnection
): Promise<{ connection: CalendarConnection; oauth: OAuth2Client }> {
  const oauth = createCalendarOAuthClient()
  applyTokensToOAuthClient(oauth, connection)

  const expiresAt = connection.tokenExpiresAt
    ? new Date(connection.tokenExpiresAt).getTime()
    : 0
  const needsRefresh =
    !connection.accessToken ||
    (expiresAt > 0 && expiresAt - Date.now() < REFRESH_BUFFER_MS)

  if (!needsRefresh) {
    return { connection, oauth }
  }

  if (!connection.refreshToken) {
    throw new Error('Calendar connection expired; reconnect Google Calendar.')
  }

  const { credentials } = await oauth.refreshAccessToken()
  oauth.setCredentials(credentials)

  const tokenExpiresAt =
    credentials.expiry_date != null
      ? new Date(credentials.expiry_date).toISOString()
      : null

  const updated = await updateCalendarConnectionTokens(db, connection.workspaceId, connection.id, {
    accessToken: credentials.access_token ?? connection.accessToken,
    refreshToken: credentials.refresh_token ?? connection.refreshToken,
    tokenExpiresAt,
  })

  return { connection: updated, oauth }
}

export async function revokeGoogleToken(token: string): Promise<void> {
  const res = await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  if (!res.ok && res.status !== 400) {
    const body = await res.text()
    throw new Error(`Google token revoke failed: ${res.status} ${body}`)
  }
}
