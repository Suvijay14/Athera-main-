'use client'

import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { format, isSameDay } from 'date-fns'
import { useCallback } from 'react'

import type { AllDayCalendarItem, TimedCalendarItem } from '@/lib/workspace/calendar-items'
import {
  CALENDAR_HOUR_HEIGHT_PX,
  CALENDAR_VISIBLE_HOUR_END,
  CALENDAR_VISIBLE_HOUR_START,
} from '@/lib/workspace/calendar-range'
import { patchForResizeTimedItem } from '@/lib/workspace/calendar-drag'
import { cn } from '@/lib/utils'

type CalendarWeekViewProps = {
  days: Date[]
  timed: TimedCalendarItem[]
  allDay: AllDayCalendarItem[]
  colorForItem: (itemId: string) => string
  onOpenItem: (id: string) => void
  onResizeItem: (itemId: string, patch: ReturnType<typeof patchForResizeTimedItem>) => void
}

function dropId(day: Date, hour: number) {
  return `week:${format(day, 'yyyy-MM-dd')}:${hour}`
}

function TimedBlock({
  entry,
  color,
  onOpenItem,
  onResizeItem,
}: {
  entry: TimedCalendarItem
  color: string
  onOpenItem: (id: string) => void
  onResizeItem: (itemId: string, patch: ReturnType<typeof patchForResizeTimedItem>) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `timed:${entry.item.id}`,
    data: { itemId: entry.item.id, source: 'timed' as const },
  })
  const startHour =
    entry.start.getHours() + entry.start.getMinutes() / 60 - CALENDAR_VISIBLE_HOUR_START
  const endHour =
    entry.end.getHours() + entry.end.getMinutes() / 60 - CALENDAR_VISIBLE_HOUR_START
  const top = Math.max(0, startHour * CALENDAR_HOUR_HEIGHT_PX)
  const height = Math.max(CALENDAR_HOUR_HEIGHT_PX / 2, (endHour - startHour) * CALENDAR_HOUR_HEIGHT_PX)
  const style = {
    top,
    height,
    backgroundColor: color,
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    opacity: isDragging ? 0.65 : 1,
  }

  const onResizePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation()
      const startY = e.clientY
      const startEnd = entry.end
      const onMove = (ev: PointerEvent) => {
        void ev
      }
      const onUp = (ev: PointerEvent) => {
        const deltaHours = (ev.clientY - startY) / CALENDAR_HOUR_HEIGHT_PX
        const newEnd = new Date(startEnd.getTime() + deltaHours * 3600_000)
        onResizeItem(entry.item.id, patchForResizeTimedItem(entry.item, newEnd))
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [entry, onResizeItem]
  )

  return (
    <div
      ref={setNodeRef}
      className="absolute left-1 right-1 z-10 overflow-hidden rounded-md px-2 py-1 text-xs text-white shadow-sm"
      style={style}
      {...listeners}
      {...attributes}
    >
      <button type="button" className="block w-full truncate text-left font-medium" onClick={() => onOpenItem(entry.item.id)}>
        {entry.item.title}
        <span className="font-normal opacity-90"> / {format(entry.start, 'h:mma').toLowerCase()}</span>
      </button>
      <div
        role="separator"
        aria-label="Resize"
        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize bg-black/10"
        onPointerDown={onResizePointerDown}
      />
    </div>
  )
}

function HourCell({ day, hour }: { day: Date; hour: number }) {
  const { setNodeRef, isOver } = useDroppable({
    id: dropId(day, hour),
    data: { mode: 'timed' as const, day, hour, minute: 0 },
  })
  return (
    <div
      ref={setNodeRef}
      className={cn('border-b border-neutral-100', isOver && 'bg-primary/10')}
      style={{ height: CALENDAR_HOUR_HEIGHT_PX }}
    />
  )
}

function AllDayColumn({
  day,
  items,
  colorForItem,
  onOpenItem,
}: {
  day: Date
  items: AllDayCalendarItem[]
  colorForItem: (id: string) => string
  onOpenItem: (id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `week-allday:${format(day, 'yyyy-MM-dd')}`,
    data: { mode: 'all-day' as const, day },
  })
  return (
    <div
      ref={setNodeRef}
      className={cn('min-h-[2.5rem] border-l border-neutral-200 p-1', isOver && 'bg-primary/10')}
    >
      <div className="flex flex-wrap gap-1">
        {items.map((a) => (
          <button
            key={a.item.id}
            type="button"
            className="rounded-full px-2 py-0.5 text-[10px] text-white"
            style={{ backgroundColor: colorForItem(a.item.id) }}
            onClick={() => onOpenItem(a.item.id)}
          >
            {a.item.title}
          </button>
        ))}
      </div>
    </div>
  )
}

export function CalendarWeekView({
  days,
  timed,
  allDay,
  colorForItem,
  onOpenItem,
  onResizeItem,
}: CalendarWeekViewProps) {
  const hours = Array.from(
    { length: CALENDAR_VISIBLE_HOUR_END - CALENDAR_VISIBLE_HOUR_START },
    (_, i) => CALENDAR_VISIBLE_HOUR_START + i
  )

  return (
    <div className="min-w-0 flex-1 overflow-x-auto">
      <div className="min-w-[720px]">
        <div className="grid grid-cols-[3rem_repeat(7,1fr)] border-b border-neutral-200">
          <div />
          {days.map((day) => (
            <div key={day.toISOString()} className="border-l border-neutral-200 px-2 py-2 text-center text-xs font-medium">
              <div>{format(day, 'EEE')}</div>
              <div className="text-neutral-900">{format(day, 'd')}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-[3rem_repeat(7,1fr)] border-b border-neutral-200 bg-neutral-50">
          <div className="text-[10px] text-neutral-500 px-1 py-1">All day</div>
          {days.map((day) => (
            <AllDayColumn
              key={day.toISOString()}
              day={day}
              items={allDay.filter((a) => isSameDay(a.date, day))}
              colorForItem={colorForItem}
              onOpenItem={onOpenItem}
            />
          ))}
        </div>
        <div className="grid grid-cols-[3rem_repeat(7,1fr)]">
          <div>
            {hours.map((h) => (
              <div
                key={h}
                className="border-b border-neutral-100 pr-1 text-right text-[10px] text-neutral-500"
                style={{ height: CALENDAR_HOUR_HEIGHT_PX }}
              >
                {format(new Date(2000, 0, 1, h), 'ha')}
              </div>
            ))}
          </div>
          {days.map((day) => (
            <div key={day.toISOString()} className="relative border-l border-neutral-200">
              {hours.map((h) => (
                <HourCell key={h} day={day} hour={h} />
              ))}
              {timed
                .filter((t) => isSameDay(t.start, day))
                .map((entry) => (
                  <TimedBlock
                    key={entry.item.id}
                    entry={entry}
                    color={colorForItem(entry.item.id)}
                    onOpenItem={onOpenItem}
                    onResizeItem={onResizeItem}
                  />
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
