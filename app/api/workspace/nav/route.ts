import { NextResponse } from 'next/server'

import { listSpaces } from '@/lib/db/spaces'
import { getWorkspaceForUser } from '@/lib/db/workspaces'
import { spaceListHref } from '@/lib/workspace/home-route'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
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
    return NextResponse.json({ spaces: [] })
  }

  const spaces = await listSpaces(client, workspace.id, { includeArchived: false })
  return NextResponse.json({
    spaces: spaces.map((space) => ({
      id: space.id,
      name: space.name,
      href: spaceListHref(space.id),
      icon: space.icon ?? 'folder',
    })),
  })
}
