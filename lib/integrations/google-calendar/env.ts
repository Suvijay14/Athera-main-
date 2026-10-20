import 'server-only'

export function getGoogleCalendarRedirectUri(): string {
  return (
    process.env.GOOGLE_CALENDAR_REDIRECT_URI ??
    'http://localhost:3001/api/integrations/google-calendar/callback'
  )
}

export function requireGoogleOAuthEnv(): { clientId: string; clientSecret: string } {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env.local')
  }
  return { clientId, clientSecret }
}
