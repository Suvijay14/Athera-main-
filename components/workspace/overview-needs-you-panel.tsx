'use client'

import { ArchiveSuggestionCard } from '@/components/adaptation/archive-suggestion-card'
import { SplitSpaceSuggestionCard } from '@/components/adaptation/split-space-suggestion-card'
import { SuggestionCard } from '@/components/adaptation/suggestion-card'
import type { Suggestion } from '@/lib/db/schemas'

type OverviewNeedsYouPanelProps = {
  pendingSuggestion: Suggestion | null
}

export function OverviewNeedsYouPanel({ pendingSuggestion }: OverviewNeedsYouPanelProps) {
  return (
    <section
      className="rounded-xl border border-border-delicate bg-surface-paper p-5"
      aria-label="Needs you"
    >
      <h2 className="text-sm font-semibold text-ink-primary">Needs you</h2>
      <p className="mt-0.5 text-xs text-ink-muted">Athera checks every night</p>
      <div className="mt-4">
        {!pendingSuggestion ? (
          <p className="text-sm text-ink-muted">Nothing needs a decision right now.</p>
        ) : pendingSuggestion.type === 'archive-entities' ? (
          <ArchiveSuggestionCard suggestion={pendingSuggestion} />
        ) : pendingSuggestion.type === 'split_space' ? (
          <SplitSpaceSuggestionCard suggestion={pendingSuggestion} />
        ) : (
          <SuggestionCard suggestion={pendingSuggestion} />
        )}
      </div>
    </section>
  )
}
