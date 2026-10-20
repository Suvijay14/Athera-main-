'use client'

import { useState } from 'react'
import clsx from 'clsx'
import type { CalendarEvent } from '@/lib/types'

function buildMonthGrid(view: Date) {
  const year = view.getFullYear()
  const month = view.getMonth()
  const first = new Date(year, month, 1)
  const startPad = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < startPad; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return cells
}

function eventDays(events: CalendarEvent[], view: Date): Set<number> {
  const month = view.getMonth()
  const year = view.getFullYear()
  const days = new Set<number>()
  for (const ev of events) {
    const parsed = Date.parse(ev.startTime)
    if (Number.isNaN(parsed)) continue
    const d = new Date(parsed)
    if (d.getMonth() === month && d.getFullYear() === year) days.add(d.getDate())
  }
  return days
}

export default function SidebarCalendar({
  events,
  agenda,
}: {
  events: CalendarEvent[]
  agenda: CalendarEvent[]
}) {
  const today = new Date()
  const [view] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const cells = buildMonthGrid(view)
  const withEvents = eventDays(events, view)

  return (
    <div className="px-3 pb-3 space-y-3">
      <div className="rounded-xl bg-surface-container-lowest border border-border-serenity p-3 shadow-serenity">
        <div className="flex items-center justify-between mb-2">
          <span className="font-jakarta text-label-lg text-on-surface">
            {view.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>
        <p className="text-body-sm text-secondary mb-2">
          {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] text-secondary font-medium mb-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <span key={`${d}-${i}`}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center text-[11px]">
          {cells.map((day, idx) => {
            if (day === null) return <span key={`e-${idx}`} />
            const isToday =
              day === today.getDate() &&
              view.getMonth() === today.getMonth() &&
              view.getFullYear() === today.getFullYear()
            const hasEvent = withEvents.has(day)
            return (
              <span
                key={`d-${idx}`}
                className={clsx(
                  'h-7 w-7 mx-auto flex items-center justify-center rounded-full',
                  isToday && 'bg-primary-container text-on-primary font-semibold',
                  !isToday && hasEvent && 'ring-1 ring-primary-fixed-dim text-primary font-medium',
                  !isToday && !hasEvent && 'text-on-surface-variant'
                )}
              >
                {day}
              </span>
            )
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="label-caps text-[10px] text-outline">Today</span>
          <span className="text-[10px] text-secondary">Agenda</span>
        </div>
        {agenda.length === 0 ? (
          <p className="text-body-sm text-secondary px-1 py-2">No events from calendar API yet.</p>
        ) : (
          <ul className="space-y-2">
            {agenda.slice(0, 4).map((ev) => (
              <li key={ev.id} className="flex gap-2 text-body-sm px-1">
                <span className="text-secondary tabular-nums w-12 shrink-0">{ev.startTime.split(' ')[0]}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container mt-1.5 shrink-0" />
                <span className="text-on-surface truncate">{ev.title}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}