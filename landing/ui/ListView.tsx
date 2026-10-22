'use client'

import ItemRow from '@/src/components/athera-ui/ItemRow'
import type { AtheraEntityGroup, AtheraListItem } from '@/src/components/athera-ui/types'

const DEFAULT_TONES = [
  'border-l-sage bg-sage-light/35 border-l-[3px]',
  'border-l-terracotta/50 bg-terracotta-light/25 border-l-[3px]',
  'border-l-border-delicate bg-surface-container/80 border-l-[3px]',
] as const

export default function ListView({
  items,
  groups,
  toneByIndex = true,
}: {
  items?: AtheraListItem[]
  groups?: AtheraEntityGroup[]
  toneByIndex?: boolean
}) {
  if (groups?.length) {
    return (
      <div className="space-y-3">
        {groups.map((group, gi) => (
          <div key={group.entity} className="space-y-1.5">
            <p className="text-[11px] font-semibold text-ink-secondary px-0.5">
              {group.entity}{' '}
              <span className="font-normal text-ink-muted">· {group.count}</span>
            </p>
            <div className="space-y-1.5">
              {group.items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={{
                    ...item,
                    toneClass:
                      item.toneClass ??
                      (toneByIndex ? DEFAULT_TONES[gi % DEFAULT_TONES.length] : undefined),
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      {(items ?? []).map((item) => (
        <ItemRow key={item.id} item={item} />
      ))}
    </div>
  )
}
