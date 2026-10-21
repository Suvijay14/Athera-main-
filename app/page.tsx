import { LandingPage } from '@/components/landing/LandingPage'
import { OverviewPageBody } from '@/components/workspace/overview-page-body'
import { WorkspaceShell } from '@/components/workspace/workspace-shell'
import { loadWorkspaceShellData } from '@/lib/workspace/load-page-data'
import { getOptionalUser } from '@/lib/supabase/get-optional-user'

export default async function Home() {
  const user = await getOptionalUser()
  if (!user) {
    return <LandingPage />
  }

  const shell = await loadWorkspaceShellData()

  return (
    <WorkspaceShell
      embedded={false}
      workspaceName={shell.workspace.name}
      defaultSpaceId={shell.defaultSpaceId}
      quietEntityIds={shell.quietEntityIds}
      spaces={shell.spaces}
      itemCountsBySpace={shell.itemCountsBySpace}
      jumpItems={shell.jumpItems}
      fields={shell.fields}
      views={shell.views}
      entities={shell.entities}
      notePages={shell.notePages}
      userEmail={shell.user.email}
    >
      <OverviewPageBody />
    </WorkspaceShell>
  )
}
