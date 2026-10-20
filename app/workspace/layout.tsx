import { WorkspaceShell } from '@/components/workspace/workspace-shell'
import { loadWorkspaceShellData } from '@/lib/workspace/load-page-data'

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const data = await loadWorkspaceShellData()

  return (
    <WorkspaceShell
      embedded
      workspaceName={data.workspace.name}
      defaultSpaceId={data.defaultSpaceId}
      quietEntityIds={data.quietEntityIds}
      spaces={data.spaces}
      itemCountsBySpace={data.itemCountsBySpace}
      jumpItems={data.jumpItems}
      fields={data.fields}
      views={data.views}
      entities={data.entities}
      notePages={data.notePages}
      userEmail={data.user.email}
    >
      {children}
    </WorkspaceShell>
  )
}
