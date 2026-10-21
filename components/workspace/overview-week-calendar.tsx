'use client'

import { format, isSameDay } from 'date-fns'
import { useMemo } from 'react'

import type { Space, WorkItem } from '@/lib/db/schemas'
import { isOpenWorkItem } from '@/lib/workspace/overview-logic'
import { weekDayColumns } from '@/lib/workspace/calendar-range'

type OverviewWeekCalendarProps = {
  items: WorkItem[]
  spaces: Space[]
  now: Date
}

function scheduleDate(item: WorkItem): Date | null {
  if (item.startAt) {
    try {
      return new Date(item.startAt)
    } catch {
      return null
    }
  }
  if (item.dueDate) {
    try {
      return new Date(`${item.dueDate}T12:00:00`)
    } catch {
      return null
    }
  }
  return null
}

export function OverviewWeekCalendar({ items, spaces, now }: OverviewWeekCalendarProps) {
  const spaceById = useMemo(() => new Map(spaces.map((s) => [s.id, s])), [spaces])
  const days = useMemo(() => weekDayColumns(now), [now])

  const openItems = useMemo(() => items.filter(isOpenWorkItem), [items])

  return (
    <div className="overflow-x-auto rounded-xl border border-border-delicate bg-surface-paper">
      <div className="grid min-w-[640px] grid-cols-7 divide-x divide-border-delicate">
        {days.map((day) => {
          const dayItems = openItems.filter((item) => {
            const d = scheduleDate(item)
            return d !== null && isSameDay(d, day)
          })
          return (
            <div key={day.toISOString()} className="min-h-[200px] p-2">
              <p className="text-center text-xs font-medium text-ink-faint">{format(day, 'EEE')}</p>
              <p className="text-center text-sm font-semibold text-ink-primary">{format(day, 'd')}</p>
              <ul className="mt-2 space-y-2">
                {dayItems.map((item) => {
                  const space = spaceById.get(item.spaceId)
                  const d = scheduleDate(item)
                  const time =
                    d && d.getHours() + d.getMinutes() > 0
                      ? format(d, 'h:mma').toLowerCase()
                      : 'All day'
                  return (
                    <li key={item.id} className="rounded-md bg-surface-container/80 px-2 py-1.5 text-xs">
                      <p className="text-[10px] text-ink-faint">{time}</p>
                      <p className="font-medium text-ink-primary">
                        {space ? `${space.name} · ` : ''}
                        {item.title}
                      </p>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}
