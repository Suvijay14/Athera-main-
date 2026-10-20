import Link from 'next/link'

import type { ChangeLogListItem } from '@/lib/db/change-log'
import {
  computeLearningStage,
  summarizeActiveChange,
  type LearningStageInfo,
} from '@/lib/workspace/learning-stage'

type LearningIndicatorProps = {
  itemCount: number
  activeAdaptationCount: number
  activeChanges: ChangeLogListItem[]
}

export function LearningIndicator({
  itemCount,
  activeAdaptationCount,
  activeChanges,
}: LearningIndicatorProps) {
  if (itemCount === 0) {
    return null
  }

  const stageInfo: LearningStageInfo = computeLearningStage(
    itemCount,
    activeAdaptationCount
  )

  const summaries = activeChanges.slice(0, 4).map(summarizeActiveChange)
  const extra = activeChanges.length - summaries.length

  return (
    <section
      className="mb-4 rounded-xl border border-border-serenity bg-surface-container-low px-4 py-3"
      aria-label="Athera learning progress"
    >
      <p className="text-sm font-medium text-on-surface">{stageInfo.label}</p>
      <div className="mt-2 flex gap-1.5" aria-hidden>
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={`h-1.5 flex-1 rounded-full ${
              step <= stageInfo.stage ? 'bg-primary' : 'bg-surface-container-high'
            }`}
          />
        ))}
      </div>
      {summaries.length > 0 ? (
        <ul className="mt-3 space-y-1 text-xs text-on-surface-variant">
          {summaries.map((line, i) => (
            <li key={`${line}-${i}`}>· {line}</li>
          ))}
        </ul>
      ) : null}
      {extra > 0 ? (
        <Link
          href="/workspace/changes"
          className="mt-2 inline-block text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          See all {activeChanges.length} changes
        </Link>
      ) : activeChanges.length > 0 ? (
        <Link
          href="/workspace/changes"
          className="mt-2 inline-block text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          What Athera changed
        </Link>
      ) : null}
    </section>
  )
}
