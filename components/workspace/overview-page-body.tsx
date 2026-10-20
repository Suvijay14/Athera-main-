import { OverviewContent } from '@/components/workspace/overview-content'
import { loadOverviewPageData } from '@/lib/workspace/load-page-data'

export async function OverviewPageBody() {
  const data = await loadOverviewPageData()
  const nowIso = new Date().toISOString()

  return (
    <OverviewContent
      workspace={data.workspace}
      spaces={data.spaces.filter((s) => !s.archivedAt)}
      items={data.items}
      defaultSpace={data.defaultSpace}
      itemLabel={data.workspace.itemLabel}
      userEmail={data.user.email}
      pendingSuggestion={data.pendingSuggestion}
      nowIso={nowIso}
    />
  )
}
