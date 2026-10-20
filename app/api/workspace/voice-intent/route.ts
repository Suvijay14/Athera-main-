import { NextResponse } from 'next/server'
import { z } from 'zod'

import { runCommandViewRequestAction } from '@/app/workspace/command-actions'
import { quickCreateWorkItemAction } from '@/app/workspace/actions'
import { getDefaultSpaceId } from '@/lib/db/spaces'
import { getWorkspaceForUser } from '@/lib/db/workspaces'
import { createClient } from '@/lib/supabase/server'

const bodySchema = z.object({
  text: z.string().trim().min(1),
})

export async function POST(request: Request) {
  const parsedBody = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const client = await createClient()
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const workspace = await getWorkspaceForUser(client, user.id)
  if (!workspace) {
    return NextResponse.json({ handled: false })
  }

  const spaceId = await getDefaultSpaceId(client, workspace.id)
  const text = parsedBody.data.text

  const viewResult = await runCommandViewRequestAction({ spaceId, text })
  if (viewResult.ok) {
    if (viewResult.action === 'unsupported') {
      return NextResponse.json({
        handled: true,
        response: viewResult.message,
      })
    }
    if (viewResult.action === 'create') {
      return NextResponse.json({
        handled: true,
        response: viewResult.summary,
        navigate: `/workspace/spaces/${viewResult.spaceId}/${viewResult.viewId}`,
      })
    }
    return NextResponse.json({
      handled: true,
      response: 'Opening that view for you.',
      navigate: `/workspace/spaces/${viewResult.spaceId}/${viewResult.viewId}`,
    })
  }

  const created = await quickCreateWorkItemAction(text)
  if (created.ok) {
    return NextResponse.json({
      handled: true,
      response: `Added "${text}" to your workspace.`,
    })
  }
  return NextResponse.json({ handled: false })
}
