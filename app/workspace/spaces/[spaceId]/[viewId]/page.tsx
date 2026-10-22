import { notFound } from 'next/navigation'

import { WorkspaceContent } from '@/components/workspace/workspace-content'
import { toCalendarConnectionSummary } from '@/lib/db/calendar-connections'
import { loadSpacePageData } from '@/lib/workspace/load-page-data'

type PageProps = {
  params: { spaceId: string; viewId: string }
}

export default async function SpaceViewPage({ params }: PageProps) {
  const data = await loadSpacePageData(params.spaceId)
  if (!data) {
    notFound()
  }
  const view = data.views.find((v) => v.id === params.viewId)
  if (!view) {
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
      spaceView="list"
      activeViewId={params.viewId}
      userEmail={data.user.email}
      pendingSuggestion={data.pendingSuggestion}
      activeAdaptationCount={data.activeAdaptationCount}
      activeChanges={data.activeChanges}
      recurrenceRules={data.recurrenceRules}
      calendarConnection={
        data.calendarConnection ? toCalendarConnectionSummary(data.calendarConnection) : null
      }
      childSpaces={data.childSpaces}
      quietEntityWeeks={data.quietEntityWeeks}
    />
  )
}
