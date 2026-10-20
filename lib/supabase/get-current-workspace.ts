import 'server-only'

import { cache } from 'react'
import { redirect } from 'next/navigation'

import { createWorkspaceForUser, getWorkspaceForUser } from '@/lib/db/workspaces'
import type { Workspace } from '@/lib/db/schemas'

import { createClient } from './server'

export type CurrentWorkspaceContext = {
  workspace: Workspace
  user: {
    id: string
    email: string | undefined
  }
}

export const getCurrentWorkspace = cache(async (): Promise<CurrentWorkspaceContext> => {
  const client = await createClient()
  const {
    data: { user },
    error,
  } = await client.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  let workspace = await getWorkspaceForUser(client, user.id)
  if (!workspace) {
    workspace = await createWorkspaceForUser(client, user.id)
  }

  const { data: billingRow } = await client
    .from('workspaces')
    .select('deleted_at')
    .eq('id', workspace.id)
    .maybeSingle()
  if (billingRow?.deleted_at) {
    redirect('/login?deleted=pending')
  }

  return {
    workspace,
    user: {
      id: user.id,
      email: user.email,
    },
  }
})
