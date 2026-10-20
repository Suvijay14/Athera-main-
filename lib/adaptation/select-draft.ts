import type { Suggestion } from '@/lib/db/schemas'

import type { SuggestionDraft } from './detector-types'
import { isDedupeBlocked } from './detector-utils'

/** Highest confidence wins; equal confidence keeps the earlier draft (detector order). */
export function selectDraftForPersistence(
  drafts: SuggestionDraft[],
  recentSuggestions: Suggestion[]
): SuggestionDraft | null {
  const allowed = drafts.filter((d) => !isDedupeBlocked(d.dedupeKey, recentSuggestions))
  if (allowed.length === 0) {
    return null
  }
  let best = allowed[0]!
  for (let i = 1; i < allowed.length; i++) {
    const d = allowed[i]!
    if (d.confidence > best.confidence) {
      best = d
    }
  }
  return best
}
