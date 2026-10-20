import type { DetectionContext, SuggestionDraft } from '@/lib/adaptation/detector-types'
import { isDedupeBlocked } from '@/lib/adaptation/detector-utils'
import { detectRepeatPatterns } from '@/lib/adaptation/repeat-detection'

export function detectRepeat(ctx: DetectionContext): SuggestionDraft | null {
  const match = detectRepeatPatterns({
    items: ctx.items,
    fields: ctx.fields,
    recurrenceRules: ctx.recurrenceRules,
    now: ctx.now,
  })
  if (!match) {
    return null
  }
  if (isDedupeBlocked(match.dedupeKey, ctx.recentSuggestions)) {
    return null
  }

  return {
    type: 'repeat-pattern',
    reason: match.reason,
    evidence: {
      normalizedTitle: match.normalizedTitle,
      count: match.items.length,
      projectedDates: match.projectedDates,
      itemIds: match.items.map((i) => i.id),
      intervalCount: match.intervalCount,
      byWeekday: match.byWeekday,
      timeOfDay: match.timeOfDay,
    },
    confidence: match.confidence,
    dedupeKey: match.dedupeKey,
    operations: match.operations,
  }
}
