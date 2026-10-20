import 'server-only'

import { google } from 'googleapis'

import { CALENDAR_OAUTH_SCOPES } from './constants'
import { getGoogleCalendarRedirectUri, requireGoogleOAuthEnv } from './env'

export function createCalendarOAuthClient() {
  const { clientId, clientSecret } = requireGoogleOAuthEnv()
  return new google.auth.OAuth2(clientId, clientSecret, getGoogleCalendarRedirectUri())
}

export function getCalendarConnectAuthUrl(state: string): string {
  const client = createCalendarOAuthClient()
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [...CALENDAR_OAUTH_SCOPES],
    state,
  })
}
