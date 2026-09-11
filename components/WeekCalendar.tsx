'use client'

import { useEffect, useState } from 'react'
import DummyControl from '@/components/DummyControl'
import { fetchCalendar } from '@/lib/api'
import { CalendarEvent } from '@/lib/types'
import clsx from 'clsx'

const typeColors: Record<string, string> = {
  class: 'bg-slate-stone',
  focus: 'bg-sage',
  deadline: 'bg-terracotta',
  meeting: 'bg-ochre',
  other: 'bg-ink-faint',
}

const statusLabels: Record<string, string> = {
  attended: 'ATTENDED',
  'up-next': 'UP NEXT',
  reserved: 'RESERVED',
  scheduled: 'SCHEDULED',
  'final-due': 'FINAL DUE',
}

function getWeekRangeLabel() {
  const now = new Date()
  const day = now.getDay()
  const start = new Date(now)
  start.setDate(now.getDate() - day)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)

  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return `${fmt(start)} – ${fmt(end)}`
}

export default function WeekCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const weekRange = getWeekRangeLabel()

  useEffect(() => {
    fetchCalendar('today')
      .then((data) => setEvents(data.events))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">📅</span>
          <h2 className="font-newsreader text-lg text-ink-primary">This Week</h2>
        </div>
        <span className="text-xs text-ink-faint">{weekRange}</span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-14 bg-surface-container rounded animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="text-sm text-ink-faint py-4">No events yet. Connect the API to sync your calendar.</p>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-4">
            {[
              { label: 'Classes', color: 'bg-slate-stone' },
              { label: 'Focus', color: 'bg-sage' },
              { label: 'Deadlines', color: 'bg-terracotta' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className={clsx('w-2 h-2 rounded-full', item.color)} />
                <span className="text-[10px] text-ink-muted">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {events.map((event) => (
              <div
                key={event.id}
                className={clsx(
                  'flex items-center gap-3 p-3 rounded-lg border',
                  event.type === 'deadline'
                    ? 'bg-terracotta-light border-terracotta/20'
                    : event.type === 'focus'
                      ? 'bg-sage-light border-sage/20'
                      : 'bg-surface-container border-border-delicate'
                )}
              >
                <div
                  className={clsx('w-0.5 h-10 rounded-full flex-shrink-0', typeColors[event.type])}
                />

                <div className="flex-1 min-w-0">
                  <p
                    className={clsx(
                      'text-sm font-medium',
                      event.type === 'deadline' ? 'text-terracotta' : 'text-ink-primary'
                    )}
                  >
                    {event.title}
                  </p>
                  <p className="text-[10px] text-ink-muted mt-0.5">
                    {event.startTime}
                    {event.endTime !== event.startTime && ` – ${event.endTime}`}
                    {event.location && ` · ${event.location}`}
                  </p>
                </div>

                {event.status && (
                  <span
                    className={clsx(
                      'text-[10px] font-semibold tracking-wide flex-shrink-0',
                      event.type === 'deadline' ? 'text-terracotta' : 'text-ink-muted'
                    )}
                  >
                    {statusLabels[event.status]}
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-delicate">
        <DummyControl className="text-xs text-terracotta px-1 py-0.5 rounded ml-auto">
          Full Calendar ↗
        </DummyControl>
      </div>
    </div>
  )
}
