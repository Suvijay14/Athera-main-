import { NextResponse } from 'next/server'

import { runRetentionForWorkspace } from '@/lib/adaptation/run-retention-for-workspace'
import { listDistinctWorkspaceIdsWithChanges } from '@/lib/db/change-log'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

function verifyCronSecret(request: Request): boolean {
  const expected = process.env.CRON_SECRET?.trim()
  if (!expected) {
    return false
  }
  const header = request.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) {
    return false
  }
  const token = header.slice('Bearer '.length).trim()
  return token.length > 0 && token === expected
}

/**
 * POST: retention evaluation job (daily via external scheduler or Vercel Cron).
 * Auth is checked before any database access.
 */
export async function POST(request: Request) {
  if (!verifyCronSecret(request)) {
    return unauthorized()
  }

  const client = createAdminClient()
  const now = new Date()

  const workspaceIds = await listDistinctWorkspaceIdsWithChanges(client)
  const results = []

  for (const workspaceId of workspaceIds) {
    results.push(await runRetentionForWorkspace(client, workspaceId, now))
  }

  return NextResponse.json({
    ok: true,
    ranAt: now.toISOString(),
    workspaceCount: workspaceIds.length,
    results,
  })
}

export async function GET(request: Request) {
  return POST(request)
}
