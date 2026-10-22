'use client'

import type { AtheraTimelineEntry } from '@/src/components/athera-ui/types'

export default function EntityPage({
  entityName,
  avatarTone,
  chips,
  timeline,
  pageLabel = 'Client page',
}: {
  entityName: string
  avatarTone: string
  chips: string[]
  timeline: AtheraTimelineEntry[]
  pageLabel?: string
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span
          className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${avatarTone}`}
        >
          {entityName.charAt(0)}
        </span>
        <div>
          <p className="text-base font-semibold text-ink-primary">{entityName}</p>
          <p className="text-xs text-ink-muted">{pageLabel}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {chips.map((chip) => (
          <span
            key={chip}
            className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-surface-container border border-border-delicate text-ink-secondary"
          >
            {chip}
          </span>
        ))}
      </div>

      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted mb-2">
        Timeline
      </p>
      <div className="space-y-2">
        {timeline.map((entry) => (
          <div
            key={entry.id}
            className="landing-card px-3 py-2.5 border-l-[3px] border-l-sage/70"
          >
            <p className="text-sm font-medium text-ink-primary">{entry.title}</p>
            <p className="text-xs text-ink-muted mt-0.5">{entry.subtitle}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
