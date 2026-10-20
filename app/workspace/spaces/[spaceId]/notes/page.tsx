import { notFound } from 'next/navigation'

import { NotesPageClient } from '@/components/workspace/notes/notes-page-client'
import { ViewTabs } from '@/components/workspace/view-tabs'
import { getPageForOwnerOrEmpty } from '@/lib/db/pages'
import { getSpaceById } from '@/lib/db/spaces'
import { listViews } from '@/lib/db/views'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/supabase/get-current-workspace'
import { extractCheckboxStatesFromDoc } from '@/lib/workspace/notes/parse-note-document'
import { getItemById } from '@/lib/db/items'

type PageProps = { params: { spaceId: string } }

export default async function SpaceNotesPage({ params }: PageProps) {
  const { workspace } = await getCurrentWorkspace()
  const client = await createClient()
  const space = await getSpaceById(client, workspace.id, params.spaceId)
  if (!space || space.archivedAt) {
    notFound()
  }

  const views = await listViews(client, workspace.id)
  const page = await getPageForOwnerOrEmpty(client, workspace.id, 'space', space.id)
  const checkboxes = extractCheckboxStatesFromDoc(page.body)
  const completionByItemId: Record<string, boolean> = {}
  for (const cb of checkboxes) {
    if (cb.itemId) {
      const item = await getItemById(client, workspace.id, cb.itemId)
      if (item) {
        completionByItemId[cb.itemId] = item.completedAt !== null
      }
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 md:px-8">
      <header className="mb-4">
        <h1 className="text-xl font-semibold text-neutral-900">{space.name}</h1>
      </header>
      <ViewTabs spaceId={space.id} views={views} notesActive />
      <NotesPageClient
        ownerType="space"
        ownerId={space.id}
        spaceId={space.id}
        entityId={null}
        initialBody={page.body}
        completionByItemId={completionByItemId}
        guidance="Jot down plans, links, and checkboxes — unchecked tasks with dates become real items in this space."
      />
    </main>
  )
}
