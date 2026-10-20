'use client'

import Link from 'next/link'
import { useMemo } from 'react'

import { OverviewNeedsYouPanel } from '@/components/workspace/overview-needs-you-panel'
import { UnsortedItemsRow } from '@/components/workspace/unsorted-items-row'
import type { Space, Suggestion, WorkItem, Workspace } from '@/lib/db/schemas'
import { displayNameFromEmail } from '@/lib/workspace/overview-display-name'
import {
  buildSpaceOverviewCards,
  countOverviewNeedYou,
  formatOverviewDateLine,
  formatOverviewWhen,
  itemsForToday,
  itemsUpcomingDays,
  timeOfDayGreeting,
} from '@/lib/workspace/overview-logic'
import { isUnsortedWorkItem } from '@/lib/workspace/item-space-state'
import { spaceListHref } from '@/lib/workspace/home-route'

type OverviewContentProps = {
  workspace: Workspace
  spaces: Space[]
  items: WorkItem[]
  defaultSpace: Space
  itemLabel: string
  userEmail?: string
  pendingSuggestion: Suggestion | null
  /** Stable clock from server render for greeting/date copy. */
  nowIso: string
}

export function OverviewContent({
  spaces,
  items,
  defaultSpace,
  itemLabel,
  userEmail,
  pendingSuggestion,
  nowIso,
}: OverviewContentProps) {
  const now = useMemo(() => new Date(nowIso), [nowIso])
  const greeting = timeOfDayGreeting(now)
  const name = displayNameFromEmail(userEmail)
  const needYouCount = countOverviewNeedYou(items, now, pendingSuggestion !== null)
  const todayItems = itemsForToday(items, now)
  const upcoming = itemsUpcomingDays(items, now, 3)
  const cards = buildSpaceOverviewCards(spaces, items, now)
  const spaceById = new Map(spaces.map((s) => [s.id, s]))

  const headline =
    needYouCount === 0
      ? `${greeting}, ${name}. You're caught up for today.`
      : `${greeting}, ${name}. ${needYouCount} ${needYouCount === 1 ? 'thing needs' : 'things need'} you today.`

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <header className="mb-8">
        <p className="text-sm text-neutral-500">{formatOverviewDateLine(now)}</p>
        <h1 className="mt-1 text-2xl font-semibold text-neutral-900">{headline}</h1>
      </header>

      <UnsortedItemsRow
        items={items}
        spaces={spaces}
        defaultSpaceId={defaultSpace.id}
        itemLabel={itemLabel}
      />

      <div className="mb-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
        <div className="min-w-0 space-y-8">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Today</h2>
            {todayItems.length === 0 ? (
              <p className="text-sm text-neutral-600">Nothing scheduled for today.</p>
            ) : (
              <ul className="space-y-2">
                {todayItems.map((item) => (
                  <OverviewItemRow
                    key={item.id}
                    item={item}
                    space={spaceById.get(item.spaceId)}
                    defaultSpaceId={defaultSpace.id}
                  />
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Coming up
            </h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-neutral-600">Nothing in the next 3 days.</p>
            ) : (
              <ul className="space-y-2">
                {upcoming.map((item) => (
                  <OverviewItemRow
                    key={item.id}
                    item={item}
                    space={spaceById.get(item.spaceId)}
                    defaultSpaceId={defaultSpace.id}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>

        <OverviewNeedsYouPanel pendingSuggestion={pendingSuggestion} />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Spaces</h2>
        {cards.length === 0 ? (
          <p className="text-sm text-neutral-600">
            No spaces yet — add a space from the sidebar to organize work.
          </p>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(({ space, openCount, nextLabel }) => (
            <Link
              key={space.id}
              href={spaceListHref(space.id)}
              className="rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: space.color ?? '#6366f1' }}
                />
                <span className="font-medium text-neutral-900">{space.name}</span>
              </div>
              <p className="mt-2 text-sm text-neutral-600">
                {openCount} open {itemLabel.toLowerCase()}
                {openCount === 1 ? '' : 's'}
              </p>
              <p className="mt-1 truncate text-xs text-neutral-500">
                {nextLabel ?? 'Nothing scheduled'}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}

function OverviewItemRow({
  item,
  space,
  defaultSpaceId,
}: {
  item: WorkItem
  space?: Space
  defaultSpaceId: string
}) {
  const unsorted = isUnsortedWorkItem(item, defaultSpaceId)
  return (
    <li className="flex flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm">
      <Link href={spaceListHref(item.spaceId)} className="font-medium text-neutral-900 hover:underline">
        {item.title}
      </Link>
      <span className="text-neutral-500">{formatOverviewWhen(item)}</span>
      {unsorted ? (
        <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-700">
          Unsorted
        </span>
      ) : space ? (
        <span
          className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
          style={{ backgroundColor: space.color ?? '#6366f1' }}
        >
          {space.name}
        </span>
      ) : null}
    </li>
  )
}
