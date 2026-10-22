'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { OverviewNeedsYouPanel } from '@/components/workspace/overview-needs-you-panel'
import { OverviewPasteWeekCard } from '@/components/workspace/overview-paste-week-card'
import { OverviewWeekCalendar } from '@/components/workspace/overview-week-calendar'
import { UnsortedItemsRow } from '@/components/workspace/unsorted-items-row'
import type { Space, Suggestion, WorkItem, Workspace } from '@/lib/db/schemas'
import { displayNameFromEmail } from '@/lib/workspace/overview-display-name'
import {
  buildSpaceOverviewCards,
  countOverviewNeedYou,
  formatOverviewDateLine,
  formatOverviewItemTitle,
  formatOverviewTimeToday,
  formatOverviewWhen,
  itemsForToday,
  itemsUpcomingDays,
  timeOfDayGreeting,
} from '@/lib/workspace/overview-logic'
import { isUnsortedWorkItem } from '@/lib/workspace/item-space-state'
import { spaceListHref } from '@/lib/workspace/home-route'
import { cn } from '@/lib/utils'

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

type OverviewViewMode = 'list' | 'calendar'

export function OverviewContent({
  spaces,
  items,
  defaultSpace,
  itemLabel,
  userEmail,
  pendingSuggestion,
  nowIso,
}: OverviewContentProps) {
  const [viewMode, setViewMode] = useState<OverviewViewMode>('list')
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
    <main className="mx-auto max-w-5xl px-4 py-8 md:px-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink-muted">{formatOverviewDateLine(now)}</p>
          <h1 className="font-newsreader mt-1 text-[1.75rem] font-medium leading-snug tracking-tight text-ink-primary md:text-[2rem]">
            {headline}
          </h1>
        </div>
        <div
          className="inline-flex rounded-full border border-border-delicate bg-surface-paper p-0.5 text-sm"
          role="tablist"
          aria-label="Overview view"
        >
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'list'}
            className={cn(
              'rounded-full px-3 py-1.5 font-medium transition-colors',
              viewMode === 'list' ? 'bg-surface-container text-ink-primary' : 'text-ink-muted hover:text-ink-primary'
            )}
            onClick={() => setViewMode('list')}
          >
            List
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'calendar'}
            className={cn(
              'rounded-full px-3 py-1.5 font-medium transition-colors',
              viewMode === 'calendar'
                ? 'bg-surface-container text-ink-primary'
                : 'text-ink-muted hover:text-ink-primary'
            )}
            onClick={() => setViewMode('calendar')}
          >
            Calendar
          </button>
        </div>
      </header>

      <OverviewPasteWeekCard />

      <UnsortedItemsRow
        items={items}
        spaces={spaces}
        defaultSpaceId={defaultSpace.id}
        itemLabel={itemLabel}
      />

      {viewMode === 'calendar' ? (
        <div className="mb-10">
          <OverviewWeekCalendar items={items} spaces={spaces} now={now} />
        </div>
      ) : (
        <div className="mb-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)]">
          <div className="min-w-0 space-y-8">
            <section>
              <h2 className="mb-3 text-sm font-semibold text-ink-primary">Today</h2>
              {todayItems.length === 0 ? (
                <p className="text-sm text-ink-muted">Nothing scheduled for today.</p>
              ) : (
                <ul className="space-y-3">
                  {todayItems.map((item) => (
                    <OverviewItemRow
                      key={item.id}
                      item={item}
                      space={spaceById.get(item.spaceId)}
                      defaultSpaceId={defaultSpace.id}
                      variant="today"
                    />
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-sm font-semibold text-ink-primary">Coming up</h2>
              {upcoming.length === 0 ? (
                <p className="text-sm text-ink-muted">Nothing in the next 3 days.</p>
              ) : (
                <ul className="space-y-2">
                  {upcoming.map((item) => (
                    <OverviewItemRow
                      key={item.id}
                      item={item}
                      space={spaceById.get(item.spaceId)}
                      defaultSpaceId={defaultSpace.id}
                      variant="upcoming"
                    />
                  ))}
                </ul>
              )}
            </section>
          </div>

          <OverviewNeedsYouPanel pendingSuggestion={pendingSuggestion} />
        </div>
      )}

      {viewMode === 'calendar' ? (
        <div className="mb-10">
          <OverviewNeedsYouPanel pendingSuggestion={pendingSuggestion} />
        </div>
      ) : null}

      <section>
        <div className="grid gap-3 sm:grid-cols-2">
          {cards.map(({ space, openCount, nextLabel }) => (
            <Link
              key={space.id}
              href={spaceListHref(space.id)}
              className="rounded-xl border border-border-delicate bg-surface-paper p-4 hover:border-border-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/30"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{space.name}</p>
              <p className="mt-1 text-sm text-ink-muted">
                {openCount} open
              </p>
              <p className="mt-1 truncate text-sm text-ink-primary">{nextLabel ?? 'Nothing scheduled'}</p>
            </Link>
          ))}
        </div>
        {cards.length === 0 ? (
          <p className="text-sm text-ink-muted">No spaces yet — add a space from the sidebar to organize work.</p>
        ) : null}
      </section>
    </main>
  )
}

function OverviewItemRow({
  item,
  space,
  defaultSpaceId,
  variant,
}: {
  item: WorkItem
  space?: Space
  defaultSpaceId: string
  variant: 'today' | 'upcoming'
}) {
  const unsorted = isUnsortedWorkItem(item, defaultSpaceId)
  const title = formatOverviewItemTitle(item, space)
  return (
    <li className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
      {variant === 'today' ? (
        <span className="w-16 shrink-0 tabular-nums text-ink-muted">{formatOverviewTimeToday(item)}</span>
      ) : (
        <span className="w-16 shrink-0 text-ink-muted">{formatOverviewWhen(item)}</span>
      )}
      <Link href={spaceListHref(item.spaceId)} className="font-medium text-ink-primary hover:underline">
        {title}
      </Link>
      {unsorted ? (
        <span className="rounded-full bg-surface-container px-2 py-0.5 text-xs font-medium text-ink-muted">
          Unsorted
        </span>
      ) : null}
    </li>
  )
}
