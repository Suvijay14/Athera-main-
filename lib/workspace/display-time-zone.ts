/**
 * Display timezone for SSR-safe date/time strings.
 * Server and browser must use the same zone — set via NEXT_PUBLIC_DISPLAY_TIME_ZONE (IANA name).
 */
export function getDisplayTimeZone(): string {
  const tz = process.env.NEXT_PUBLIC_DISPLAY_TIME_ZONE?.trim()
  return tz && tz.length > 0 ? tz : 'UTC'
}
