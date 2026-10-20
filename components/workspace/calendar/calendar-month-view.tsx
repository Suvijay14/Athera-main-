'use client'

import { useDroppable } from '@dnd-kit/core'
import { format, isSameMonth, isSameDay } from 'date-fns'

import type { AllDayCalendarItem, TimedCalendarItem } from '@/lib/workspace/calendar-items'
import { cn } from '@/lib/utils'

const MAX_CHIPS = 3

type CalendarMonthViewProps = {
  anchor: Date
  days: Date[]
  timed: TimedCalendarItem[]
  allDay: AllDayCalendarItem[]
  colorForItem: (itemId: string) => string
  onOpenItem: (id: string) => void
}

function MonthDayCell({
  day,
  anchor,
  timed,
  allDay,
  colorForItem,
  onOpenItem,
}: {
  day: Date
  anchor: Date
  timed: TimedCalendarItem[]
  allDay: AllDayCalendarItem[]
  colorForItem: (id: string) => string
  onOpenItem: (id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `month:${format(day, 'yyyy-MM-dd')}`,
    data: { mode: 'all-day' as const, day },
  })
  const dayTimed = timed.filter((t) => isSameDay(t.start, day))
  const dayAll = allDay.filter((a) => isSameDay(a.date, day))
  const chips = [
    ...dayAll.map((a) => ({ id: a.item.id, title: a.item.title, kind: 'all' as const })),
    ...dayTimed.map((t) => ({ id: t.item.id, title: t.item.title, kind: 'timed' as const })),
  ]
  const visible = chips.slice(0, MAX_CHIPS)
  const overflow = chips.length - visible.length

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-[5.5rem] border border-neutral-100 p-1',
        !isSameMonth(day, anchor) && 'bg-neutral-50 text-neutral-400',
        isOver && 'bg-primary/10'
      )}
    >
      <div className="text-[10px] font-medium">{format(day, 'd')}</div>
      <ul className="mt-1 space-y-0.5">
        {visible.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              className="block w-full truncate rounded px-1 py-0.5 text-left text-[10px] text-white"
              style={{ backgroundColor: colorForItem(c.id) }}
              onClick={() => onOpenItem(c.id)}
            >
              {c.title}
            </button>
          </li>
        ))}
        {overflow > 0 ? (
          <li className="text-[10px] text-neutral-500">+{overflow} more</li>
        ) : null}
      </ul>
    </div>
  )
}

export function CalendarMonthView({
  anchor,
  days,
  timed,
  allDay,
  colorForItem,
  onOpenItem,
}: CalendarMonthViewProps) {
  return (
    <div className="min-w-0 flex-1">
      <div className="grid grid-cols-7 gap-0 border border-neutral-200 text-center text-[10px] font-medium text-neutral-500">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="border-b border-neutral-200 py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => (
          <MonthDayCell
            key={day.toISOString()}
            day={day}
            anchor={anchor}
            timed={timed}
            allDay={allDay}
            colorForItem={colorForItem}
            onOpenItem={onOpenItem}
          />
        ))}
      </div>
    </div>
  )
}
