'use client'

import clsx from 'clsx'
import DemoItemIcon from '@/components/landing/DemoItemIcon'
import type { AtheraListItem } from '@/src/components/athera-ui/types'

export default function ItemRow({
  item,
  className = '',
}: {
  item: AtheraListItem
  className?: string
}) {
  return (
    <div className={clsx('landing-card px-3 py-2.5 flex items-start gap-2', item.toneClass, className)}>
      {item.icon ? (
        <DemoItemIcon icon={item.icon} className="w-4 h-4 text-ink-muted shrink-0 mt-0.5" />
      ) : null}
      <p className="text-sm text-ink-primary leading-snug min-w-0">{item.title}</p>
    </div>
  )
}
