import { notFound } from 'next/navigation'

import { WorkspaceContent } from '@/components/workspace/workspace-content'
import { toCalendarConnectionSummary } from '@/lib/db/calendar-connections'
import { loadSpacePageData } from '@/lib/workspace/load-page-data'

type PageProps = {
  params: { spaceId: string }
}

export default async function SpaceWorkspacePage({ params }: PageProps) {
  const data = await loadSpacePageData(params.spaceId)
  if (!data) {
    notFound()
  }

  return (
    <WorkspaceContent
      workspace={data.workspace}
      fields={data.fields}
      items={data.items}
      spaces={data.spaces.filter((s) => !s.archivedAt)}
      currentSpace={data.currentSpace}
      entities={data.entities}
      defaultSpace={data.defaultSpace}
      views={data.views}
      activeViewId={null}
      userEmail={data.user.email}
      pendingSuggestion={data.pendingSuggestion}
      activeAdaptationCount={data.activeAdaptationCount}
      activeChanges={data.activeChanges}
      recurrenceRules={data.recurrenceRules}
      calendarConnection={
        data.calendarConnection ? toCalendarConnectionSummary(data.calendarConnection) : null
      }
    />
  )
}
