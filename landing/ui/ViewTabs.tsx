'use client'

import clsx from 'clsx'

export default function ViewTabs({
  active,
  showCalendar,
}: {
  active: 'list' | 'calendar'
  showCalendar?: boolean
}) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-border-delicate px-0.5 py-0.5">
      <span
        className={clsx(
          'px-2.5 py-1 text-[10px] font-medium rounded-full',
          active === 'list' ? 'bg-terracotta text-white' : 'text-ink-muted'
        )}
      >
        List
      </span>
      {showCalendar !== false ? (
        <span
          className={clsx(
            'px-2.5 py-1 text-[10px] font-medium rounded-full',
            active === 'calendar' ? 'bg-terracotta text-white' : 'text-ink-muted'
          )}
        >
          Calendar
        </span>
      ) : null}
    </div>
  )
}
