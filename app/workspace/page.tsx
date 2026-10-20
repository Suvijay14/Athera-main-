import { redirect } from 'next/navigation'

import { countOpenWorkItems } from '@/lib/billing/workspace-billing'
import { needsColdStartOnboarding } from '@/lib/onboarding/needs-cold-start'
import { listSpaces } from '@/lib/db/spaces'
import { resolveWorkspaceHomeHref } from '@/lib/workspace/home-route'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/supabase/get-current-workspace'

export default async function WorkspaceRootPage() {
  const { workspace } = await getCurrentWorkspace()
  const client = await createClient()
  const openItems = await countOpenWorkItems(client, workspace.id)
  if (needsColdStartOnboarding(workspace.onboardingAnswers, openItems)) {
    redirect('/onboarding')
  }
  const spaces = await listSpaces(client, workspace.id)
  redirect(resolveWorkspaceHomeHref(spaces))
}
