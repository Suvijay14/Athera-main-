/**
 * Legacy UI #1 filesystem spaces (`lib/server/spaces`, `/api/spaces`).
 * Disabled by default so structural changes only hit Supabase workspace tables.
 */
export function legacyFilesystemApiEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false
  }
  return process.env.LEGACY_FILESYSTEM_API === 'true'
}

export function legacyFilesystemApiBlockedResponse(): Response {
  return Response.json(
    {
      error: 'Legacy filesystem spaces API is disabled. Use /workspace spaces instead.',
    },
    { status: 410 }
  )
}
