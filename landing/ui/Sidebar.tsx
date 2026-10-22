'use client'

import clsx from 'clsx'
import AtheraMark from '@/components/brand/AtheraMark'
import type { AtheraSpaceNavItem } from '@/src/components/athera-ui/types'

export default function Sidebar({
  spaces,
  showMark = true,
  className = '',
}: {
  spaces: AtheraSpaceNavItem[]
  showMark?: boolean
  className?: string
}) {
  return (
    <aside
      className={clsx(
        'shrink-0 border-r border-border-delicate pr-2.5 pt-0.5 w-[128px]',
        className
      )}
    >
      {showMark ? <AtheraMark size={22} className="mb-2" /> : null}
      <p className="text-[9px] font-semibold tracking-widest uppercase text-ink-muted mb-2">
        Spaces
      </p>
      <nav className="space-y-0.5 text-[11px]">
        {spaces.map((space) => (
          <div
            key={space.id}
            className={clsx(
              'px-2 py-1 rounded-md truncate',
              space.active
                ? 'bg-surface-container font-medium text-ink-primary'
                : 'text-ink-muted'
            )}
          >
            {space.label}
          </div>
        ))}
      </nav>
    </aside>
  )
}
