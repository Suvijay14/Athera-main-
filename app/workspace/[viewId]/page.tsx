import { notFound, redirect } from 'next/navigation'

import { listViews } from '@/lib/db/views'
import { spaceViewHref } from '@/lib/workspace/home-route'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/supabase/get-current-workspace'
import { getDefaultSpaceId } from '@/lib/db/spaces'

type PageProps = {
  params: { viewId: string }
}

/** Legacy Task 3 URLs: /workspace/[viewId] → default space + view */
export default async function LegacyWorkspaceViewRedirect({ params }: PageProps) {
  const { workspace } = await getCurrentWorkspace()
  const client = await createClient()
  const views = await listViews(client, workspace.id)
  const view = views.find((v) => v.id === params.viewId)
  if (!view) {
    notFound()
  }
  const defaultSpaceId = await getDefaultSpaceId(client, workspace.id)
  redirect(spaceViewHref(defaultSpaceId, view.id))
}
