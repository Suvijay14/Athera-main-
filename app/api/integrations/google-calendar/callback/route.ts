import { NextRequest, NextResponse } from 'next/server'

import { upsertCalendarConnection } from '@/lib/db/calendar-connections'
import { getSpaceById } from '@/lib/db/spaces'
import { runGoogleCalendarImportForConnection } from '@/lib/integrations/google-calendar-import'
import { createCalendarOAuthClient } from '@/lib/integrations/google-calendar/oauth-client'
import { decodeCalendarOAuthState } from '@/lib/integrations/google-calendar/oauth-state'
import { getWorkspaceForUser } from '@/lib/db/workspaces'
import { createClient } from '@/lib/supabase/server'

function redirectToSpace(
  req: NextRequest,
  spaceId: string,
  params: Record<string, string>
): NextResponse {
  const url = new URL(`/workspace/spaces/${spaceId}`, req.url)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return NextResponse.redirect(url)
}

export async function GET(req: NextRequest) {
  const error = req.nextUrl.searchParams.get('error')
  const stateRaw = req.nextUrl.searchParams.get('state')
  const code = req.nextUrl.searchParams.get('code')

  const state = stateRaw ? decodeCalendarOAuthState(stateRaw) : null
  const spaceId = state?.spaceId ?? ''

  if (error) {
    if (spaceId) {
      return redirectToSpace(req, spaceId, { calendar: 'error', message: error })
    }
    return NextResponse.redirect(new URL('/workspace?calendar=error', req.url))
  }

  if (!state || !code) {
    if (spaceId) {
      return redirectToSpace(req, spaceId, { calendar: 'error', message: 'invalid_callback' })
    }
    return NextResponse.redirect(new URL('/workspace?calendar=error', req.url))
  }

  const client = await createClient()
  const {
    data: { user },
  } = await client.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const workspace = await getWorkspaceForUser(client, user.id)
  if (!workspace || workspace.id !== state.workspaceId) {
    return redirectToSpace(req, state.spaceId, { calendar: 'error', message: 'workspace_mismatch' })
  }

  const space = await getSpaceById(client, state.workspaceId, state.spaceId)
  if (!space) {
    return redirectToSpace(req, state.spaceId, { calendar: 'error', message: 'space_not_found' })
  }

  try {
    const oauth = createCalendarOAuthClient()
    const { tokens } = await oauth.getToken(code)
    if (!tokens.access_token) {
      return redirectToSpace(req, state.spaceId, {
        calendar: 'error',
        message: 'missing_access_token',
      })
    }

    const tokenExpiresAt =
      tokens.expiry_date != null ? new Date(tokens.expiry_date).toISOString() : null

    const connection = await upsertCalendarConnection(client, state.workspaceId, {
      spaceId: state.spaceId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      tokenExpiresAt,
      calendarId: 'primary',
    })

    let importedCount = 0
    try {
      const result = await runGoogleCalendarImportForConnection(client, connection)
      importedCount = result.importedCount
    } catch (importErr) {
      const message =
        importErr instanceof Error ? importErr.message : 'import_failed'
      return redirectToSpace(req, state.spaceId, {
        calendar: 'connected',
        import: 'error',
        message,
      })
    }

    return redirectToSpace(req, state.spaceId, {
      calendar: 'connected',
      imported: String(importedCount),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'token_exchange_failed'
    return redirectToSpace(req, state.spaceId, { calendar: 'error', message })
  }
}
