'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import type { ViewDefinition } from '@/lib/db/schemas'
import { spaceTabViews } from '@/lib/workspace/builtin-space-views'
import { spaceCalendarHref, spaceListHref, spaceNotesHref, spaceViewHref } from '@/lib/workspace/home-route'
import { cn } from '@/lib/utils'

type ViewTabsProps = {
  spaceId: string
  views: ViewDefinition[]
  notesActive?: boolean
}

export function ViewTabs({ spaceId, views, notesActive }: ViewTabsProps) {
  const pathname = usePathname()
  const allHref = spaceListHref(spaceId)
  const calendarHref = spaceCalendarHref(spaceId)
  const notesHref = spaceNotesHref(spaceId)
  const onAll = pathname === allHref
  const onCalendar = pathname === calendarHref
  const onNotes = notesActive ?? pathname === notesHref
  const extraViews = spaceTabViews(views)

  return (
    <nav className="mb-4 flex gap-1 overflow-x-auto border-b border-neutral-200 pb-px" aria-label="Views">
      <Link
        href={allHref}
        className={cn(
          'whitespace-nowrap rounded-t-lg px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          onAll
            ? 'border border-b-white border-neutral-200 bg-white text-neutral-900'
            : 'text-neutral-600 hover:text-neutral-900'
        )}
        aria-current={onAll ? 'page' : undefined}
      >
        List
      </Link>
      <Link
        href={notesHref}
        className={cn(
          'whitespace-nowrap rounded-t-lg px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          onNotes
            ? 'border border-b-white border-neutral-200 bg-white text-neutral-900'
            : 'text-neutral-600 hover:text-neutral-900'
        )}
        aria-current={onNotes ? 'page' : undefined}
      >
        Notes
      </Link>
      <Link
        href={calendarHref}
        className={cn(
          'whitespace-nowrap rounded-t-lg px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          onCalendar
            ? 'border border-b-white border-neutral-200 bg-white text-neutral-900'
            : 'text-neutral-600 hover:text-neutral-900'
        )}
        aria-current={onCalendar ? 'page' : undefined}
      >
        Calendar
      </Link>
      {extraViews.map((view) => {
        const href = spaceViewHref(spaceId, view.id)
        const active = pathname === href
        return (
          <Link
            key={view.id}
            href={href}
            className={cn(
              'whitespace-nowrap rounded-t-lg px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              active
                ? 'border border-b-white border-neutral-200 bg-white text-neutral-900'
                : 'text-neutral-600 hover:text-neutral-900'
            )}
            aria-current={active ? 'page' : undefined}
          >
            {view.name}
          </Link>
        )
      })}
    </nav>
  )
}
