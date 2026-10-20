'use client'

import Link from 'next/link'
import type { CalendarEvent } from '@/lib/types'

function formatDayBlock(startTime: string, index: number) {
  const parsed = Date.parse(startTime)
  if (!Number.isNaN(parsed)) {
    const d = new Date(parsed)
    return {
      dow: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase().slice(0, 3),
      day: d.getDate(),
    }
  }
  return { dow: '—', day: index + 1 }
}

export default function UpcomingEventsCard({
  events,
  fromApi,
  calendarConnected = false,
}: {
  events: CalendarEvent[]
  fromApi: boolean
  calendarConnected?: boolean
}) {
  const slice = events.slice(0, 5)

  return (
    <div className="card-v2 p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-primary">calendar_today</span>
          <h2 className="font-jakarta text-headline-md text-on-surface">Upcoming</h2>
        </div>
        <span className="text-body-sm text-secondary">Next 3 days</span>
      </div>

      {slice.length === 0 ? (
        <p className="text-body-sm text-secondary flex-1 py-8">
          {fromApi
            ? calendarConnected
              ? 'No timed events in the next few days. Sync Google Calendar from workspace settings if you expect more.'
              : 'No timed events yet. Connect Google Calendar in workspace settings to import your schedule.'
            : 'Sign in to see your workspace schedule here.'}
        </p>
      ) : (
        <ul className="space-y-3 flex-1">
          {slice.map((ev, i) => {
            const block = formatDayBlock(ev.startTime, i)
            return (
              <li
                key={ev.id}
                className="flex gap-3 p-3 rounded-xl bg-surface-container-low/80 hover:bg-surface-container transition-colors"
              >
                <div className="text-center shrink-0 w-10">
                  <div className="text-[10px] font-jakarta font-bold text-secondary">{block.dow}</div>
                  <div className="text-lg font-jakarta font-semibold text-on-surface">{block.day}</div>
                </div>
                <div className="flex-1 min-w-0 border-l border-border-serenity pl-3">
                  <p className="text-body-sm text-secondary tabular-nums">
                    {ev.startTime}
                    {ev.endTime !== ev.startTime ? ` – ${ev.endTime}` : ''}
                  </p>
                  <p className="text-body-md font-medium text-on-surface truncate">{ev.title}</p>
                  {ev.location && (
                    <p className="text-body-sm text-secondary truncate mt-0.5">{ev.location}</p>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex items-center justify-between pt-4 mt-2 border-t border-border-serenity/60 text-body-sm">
        <span className="text-secondary">Conflict detection not available</span>
        <Link
          href="/workspace/settings"
          className="text-primary font-jakarta font-semibold hover:underline"
        >
          Calendar settings →
        </Link>
      </div>
    </div>
  )
}
