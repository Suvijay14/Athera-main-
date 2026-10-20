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
      className="rounded-xl border border-neutral-200 bg-white p-4"
      aria-label="Needs you"
    >
      <h2 className="text-sm font-semibold text-neutral-900">Needs you</h2>
      <p className="mt-1 text-xs text-neutral-600">Suggestions waiting for your decision.</p>
      <div className="mt-4">
        {!pendingSuggestion ? (
          <p className="text-sm text-neutral-600">Nothing needs a decision right now.</p>
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
