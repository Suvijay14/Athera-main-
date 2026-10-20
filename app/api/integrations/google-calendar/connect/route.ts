import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { getSpaceById } from '@/lib/db/spaces'
import { encodeCalendarOAuthState } from '@/lib/integrations/google-calendar/oauth-state'
import { getCalendarConnectAuthUrl } from '@/lib/integrations/google-calendar/oauth-client'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/supabase/get-current-workspace'

const querySchema = z.object({
  spaceId: z.string().uuid(),
})

export async function GET(req: NextRequest) {
  const parsed = querySchema.safeParse({
    spaceId: req.nextUrl.searchParams.get('spaceId'),
  })
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_space_id' }, { status: 400 })
  }

  try {
    const { workspace } = await getCurrentWorkspace()
    const client = await createClient()
    const space = await getSpaceById(client, workspace.id, parsed.data.spaceId)
    if (!space || space.archivedAt) {
      return NextResponse.json({ error: 'space_not_found' }, { status: 404 })
    }

    const { getWorkspaceBilling } = await import('@/lib/billing/workspace-billing')
    const { canUseCalendarImport } = await import('@/lib/billing/plans')
    const billing = await getWorkspaceBilling(client, workspace.id)
    if (
      !canUseCalendarImport(billing?.plan ?? 'free', billing?.subscriptionStatus ?? 'active')
    ) {
      return NextResponse.redirect(
        new URL('/workspace/settings?upgrade=calendar', req.url)
      )
    }

    const state = encodeCalendarOAuthState({
      workspaceId: workspace.id,
      spaceId: space.id,
      issuedAt: Date.now(),
    })
    const url = getCalendarConnectAuthUrl(state)
    return NextResponse.redirect(url)
  } catch {
    return NextResponse.redirect(new URL('/login', req.url))
  }
}
