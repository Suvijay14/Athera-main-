import { parseISO } from 'date-fns'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { NotesPageClient } from '@/components/workspace/notes/notes-page-client'
import { EntityArchiveButton } from '@/components/workspace/entity-archive-button'
import { getEntityById } from '@/lib/db/entities'
import { getItemById, listItems } from '@/lib/db/items'
import { getPageForOwnerOrEmpty } from '@/lib/db/pages'
import { getSpaceById } from '@/lib/db/spaces'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/supabase/get-current-workspace'
import { spaceListHref } from '@/lib/workspace/home-route'
import { extractCheckboxStatesFromDoc } from '@/lib/workspace/notes/parse-note-document'

type PageProps = {
  params: { spaceId: string; entityId: string }
}

function itemSortKey(item: {
  startAt: string | null
  dueDate: string | null
}): number {
  const raw = item.startAt ?? (item.dueDate ? `${item.dueDate}T12:00:00.000Z` : null)
  if (!raw) {
    return Number.MAX_SAFE_INTEGER
  }
  try {
    return parseISO(raw).getTime()
  } catch {
    return Number.MAX_SAFE_INTEGER
  }
}

function formatNotesActivity(props: Record<string, unknown>): string | null {
  const count = typeof props.checkboxes_created === 'number' ? props.checkboxes_created : 0
  if (count <= 0) {
    return 'Notes updated'
  }
  return `Notes updated · ${count} task${count === 1 ? '' : 's'} created`
}

export default async function EntityPage({ params }: PageProps) {
  const { workspace } = await getCurrentWorkspace()
  const client = await createClient()
  const space = await getSpaceById(client, workspace.id, params.spaceId)
  const entity = await getEntityById(client, workspace.id, params.entityId)
  if (!space || !entity || entity.spaceId !== params.spaceId) {
    notFound()
  }

  const page = await getPageForOwnerOrEmpty(client, workspace.id, 'entity', entity.id)
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

  const { data: noteEvents } = await client
    .from('events')
    .select('created_at, props')
    .eq('workspace_id', workspace.id)
    .eq('name', 'notes_updated')
    .filter('props->>owner_id', 'eq', entity.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { items } = await listItems(client, workspace.id, { spaceId: params.spaceId, limit: 500 })
  const linked = items.filter((item) => {
    for (const val of Object.values(item.data)) {
      if (val === entity.id) {
        return true
      }
    }
    return false
  })

  const now = Date.now()
  const upcoming = linked
    .filter((i) => itemSortKey(i) >= now - 86400000)
    .sort((a, b) => itemSortKey(a) - itemSortKey(b))
  const past = linked
    .filter((i) => itemSortKey(i) < now - 86400000)
    .sort((a, b) => itemSortKey(b) - itemSortKey(a))

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 md:px-8">
      <Link href={spaceListHref(params.spaceId)} className="text-sm text-primary hover:underline">
        ← Back to {space.name}
      </Link>
      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: entity.color ?? '#6366f1' }}
            />
            <h1 className="text-2xl font-semibold text-neutral-900">{entity.name}</h1>
          </div>
          <p className="mt-1 text-sm capitalize text-neutral-600">{entity.kind}</p>
          {entity.aliases.length > 0 ? (
            <p className="mt-1 text-xs text-neutral-500">Also: {entity.aliases.join(', ')}</p>
          ) : null}
        </div>
        {!entity.archivedAt ? <EntityArchiveButton entityId={entity.id} /> : null}
      </header>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Notes</h2>
        <NotesPageClient
          ownerType="entity"
          ownerId={entity.id}
          spaceId={space.id}
          entityId={entity.id}
          initialBody={page.body}
          completionByItemId={completionByItemId}
          guidance="Capture context for this contact — checkboxes with dates become linked tasks in this space."
        />
      </section>

      {(noteEvents?.length ?? 0) > 0 ? (
        <section className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Activity</h3>
          <ul className="mt-2 space-y-1 text-sm text-neutral-700">
            {(noteEvents ?? []).map((ev) => {
              const props = (ev.props ?? {}) as Record<string, unknown>
              const label = formatNotesActivity(props)
              return (
                <li key={ev.created_at as string}>
                  {label} · {new Date(ev.created_at as string).toLocaleString()}
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-600">No upcoming items linked.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {upcoming.map((item) => (
              <li key={item.id} className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm">
                {item.title}
                {item.completedAt ? (
                  <span className="ml-2 text-xs text-neutral-500">Done</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Past</h2>
        {past.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-600">No past items linked.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {past.map((item) => (
              <li key={item.id} className="rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700">
                {item.title}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
