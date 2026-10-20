'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import { moveWorkItemToSpaceAction } from '@/app/workspace/space-item-actions'
import type { Space, WorkItem } from '@/lib/db/schemas'
import { listUnsortedWorkItems } from '@/lib/workspace/item-space-state'

type UnsortedItemsRowProps = {
  items: WorkItem[]
  spaces: Space[]
  defaultSpaceId: string
  itemLabel: string
}

export function UnsortedItemsRow({
  items,
  spaces,
  defaultSpaceId,
  itemLabel,
}: UnsortedItemsRowProps) {
  const unsorted = listUnsortedWorkItems(items, defaultSpaceId)
  const assignableSpaces = spaces.filter((s) => !s.isDefault && !s.archivedAt)
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  if (unsorted.length === 0 || assignableSpaces.length === 0) {
    return null
  }

  return (
    <section className="mb-8 rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3">
      <h2 className="text-sm font-semibold text-amber-900">
        {unsorted.length} {itemLabel.toLowerCase()}
        {unsorted.length === 1 ? '' : 's'} need a space
      </h2>
      <ul className="mt-3 space-y-2">
        {unsorted.slice(0, 8).map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center gap-2 rounded-md bg-white/80 px-2 py-2 text-sm"
          >
            <span className="font-medium text-neutral-900">{item.title}</span>
            <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs text-neutral-700">
              Unsorted
            </span>
            <span className="text-xs text-neutral-500">Move to</span>
            {assignableSpaces.map((space) => (
              <button
                key={space.id}
                type="button"
                disabled={pending}
                className="rounded-full px-2.5 py-0.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                style={{ backgroundColor: space.color ?? '#6366f1' }}
                onClick={() => {
                  startTransition(async () => {
                    await moveWorkItemToSpaceAction({ itemId: item.id, toSpaceId: space.id })
                    router.refresh()
                  })
                }}
              >
                {space.name}
              </button>
            ))}
          </li>
        ))}
      </ul>
      {unsorted.length > 8 ? (
        <p className="mt-2 text-xs text-amber-800">And {unsorted.length - 8} more in your default space.</p>
      ) : null}
    </section>
  )
}
