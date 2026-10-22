import { PasteWeekPageClient } from '@/components/workspace/paste-week-page-client'
import { entityFieldKeys } from '@/lib/workspace/entity-items'
import { loadWorkspaceShellData } from '@/lib/workspace/load-page-data'

export default async function PasteWeekPage() {
  const data = await loadWorkspaceShellData()
  const activeSpaces = data.spaces.filter((s) => !s.archivedAt)
  const personalSpace =
    activeSpaces.find((s) => s.name.trim().toLowerCase() === 'personal') ?? data.defaultSpace

  return (
    <PasteWeekPageClient
      spaces={activeSpaces}
      entities={data.entities}
      entityFieldKeys={entityFieldKeys(data.fields)}
      defaultSpaceId={data.defaultSpaceId}
      personalSpaceId={personalSpace.id}
      calendarConnectHref={`/workspace/spaces/${data.defaultSpaceId}?connectCalendar=1`}
    />
  )
}
