export const GOOGLE_CALENDAR_PROVIDER = 'google_calendar' as const

export const CALENDAR_READONLY_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly'

export const CALENDAR_OAUTH_SCOPES = [
  CALENDAR_READONLY_SCOPE,
  'https://www.googleapis.com/auth/userinfo.email',
] as const

export const IMPORT_WINDOW_DAYS = 28
