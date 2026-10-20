import { NextResponse } from 'next/server'

import {
  listAllWorkspaceIds,
  runNightlyDetectionForWorkspace,
} from '@/lib/adaptation/run-nightly-detection'
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

export async function POST(request: Request) {
  if (!verifyCronSecret(request)) {
    return unauthorized()
  }

  const client = createAdminClient()
  const now = new Date()
  const workspaceIds = await listAllWorkspaceIds(client)
  const results: { workspaceId: string; inserted: boolean }[] = []

  for (const workspaceId of workspaceIds) {
    const suggestion = await runNightlyDetectionForWorkspace(client, workspaceId, now)
    results.push({ workspaceId, inserted: suggestion !== null })
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
