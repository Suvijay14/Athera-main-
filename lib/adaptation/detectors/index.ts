import type { DetectionContext, SuggestionDraft } from '@/lib/adaptation/detector-types'

import { detectRepeatedEntity } from './detect-repeated-entity'
import { detectRepeat } from './detect-repeat'
import { detectStatusInNotes } from './detect-status-in-notes'
import { detectUnusedField } from './detect-unused-field'

export const DETECTORS_IN_ORDER = [
  detectRepeatedEntity,
  detectStatusInNotes,
  detectRepeat,
  detectUnusedField,
] as const

export function runAllDetectors(ctx: DetectionContext): SuggestionDraft[] {
  const drafts: SuggestionDraft[] = []
  for (const detect of DETECTORS_IN_ORDER) {
    const draft = detect(ctx)
    if (draft) {
      drafts.push(draft)
    }
  }
  return drafts
}

export { detectRepeatedEntity } from './detect-repeated-entity'
export { detectStatusInNotes } from './detect-status-in-notes'
export { detectRepeat } from './detect-repeat'
export { detectUnusedField } from './detect-unused-field'
