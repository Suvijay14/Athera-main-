/** Routes reachable without a Supabase session. */
export const PUBLIC_PATH_PREFIXES = ['/login', '/signup', '/privacy'] as const

export function isPublicPath(pathname: string): boolean {
  if (pathname === '/') {
    return true
  }
  return PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

export function isAuthEntryPath(pathname: string): boolean {
  return pathname === '/login' || pathname === '/signup'
}

/** API routes that must work without a logged-in user (webhooks, cron, OAuth callbacks). */
export function isAuthExemptApiPath(pathname: string): boolean {
  if (!pathname.startsWith('/api/')) {
    return false
  }
  return (
    pathname.startsWith('/api/webhooks/') ||
    pathname.startsWith('/api/cron/') ||
    pathname.startsWith('/api/integrations/google-calendar/callback') ||
    pathname.startsWith('/api/auth/gmail/callback') ||
    pathname.startsWith('/api/auth/canvas/') ||
    pathname.startsWith('/api/profile/bootstrap')
  )
}
