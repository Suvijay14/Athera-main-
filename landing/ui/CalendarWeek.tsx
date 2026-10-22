'use client'

import clsx from 'clsx'
import { motion } from 'framer-motion'
import { WEEKDAY_LABELS } from '@/demo-data'
import {
  GRID_TIME_LABELS,
  parseTimeMinutesFromText,
  timeToTopPercent,
} from '@/lib/landing/calendar-demo'

export type CalendarWeekEvent = {
  id: string
  label: string
  weekday: number
  toneClass?: string
  timeHint?: string
}

export default function CalendarWeek({
  events,
  compact,
}: {
  events: CalendarWeekEvent[]
  compact?: boolean
}) {
  if (compact) {
    return (
      <div className="grid grid-cols-7 gap-1 text-[9px]">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="text-center font-semibold text-ink-muted py-0.5">
            {d}
          </div>
        ))}
        {WEEKDAY_LABELS.map((_, day) => {
          const dayEvents = events.filter((e) => e.weekday === day)
          return (
            <div
              key={day}
              className="min-h-[72px] rounded-md border border-border-delicate bg-surface-container/35 p-0.5 space-y-0.5"
            >
              {dayEvents.map((e) => (
                <div
                  key={e.id}
                  className={clsx('rounded px-1 py-0.5 text-[8px] leading-tight', e.toneClass)}
                >
                  <span className="line-clamp-2 block">{e.label}</span>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[min(280px,42vh)] min-h-[220px]">
      <div className="flex gap-0.5 shrink-0 mb-0.5 pl-7">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="flex-1 text-center text-[9px] font-semibold text-ink-muted">
            {d}
          </div>
        ))}
      </div>
      <div className="flex-1 min-h-0 flex gap-0.5">
        <div className="w-7 shrink-0 relative text-[10px] text-ink-faint">
          {GRID_TIME_LABELS.map((label, i) => (
            <span
              key={label}
              className="absolute right-0.5 -translate-y-1/2 leading-none"
              style={{ top: `${(i / (GRID_TIME_LABELS.length - 1)) * 100}%` }}
            >
              {label}
            </span>
          ))}
        </div>
        <div className="flex-1 min-h-0 grid grid-cols-7 gap-0.5">
          {WEEKDAY_LABELS.map((_, day) => (
            <div
              key={day}
              className="relative h-full rounded-sm border border-border-delicate/70 bg-surface-container/25 overflow-hidden"
            >
              {GRID_TIME_LABELS.map((_, i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 border-t border-border-delicate/40 pointer-events-none"
                  style={{ top: `${(i / (GRID_TIME_LABELS.length - 1)) * 100}%` }}
                />
              ))}
              {events
                .filter((e) => e.weekday === day)
                .map((e) => {
                  const top = timeToTopPercent(
                    parseTimeMinutesFromText(e.timeHint ?? e.label)
                  )
                  return (
                    <motion.div
                      key={e.id}
                      layoutId={`cal-${e.id}`}
                      className={clsx(
                        'absolute left-0.5 right-0.5 rounded px-1 py-0.5 text-[9px] leading-tight shadow-sm',
                        e.toneClass
                      )}
                      style={{ top: `calc(${top}% - 3px)`, maxHeight: '2.5rem' }}
                    >
                      <span className="line-clamp-2 text-ink-primary">{e.label}</span>
                    </motion.div>
                  )
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
