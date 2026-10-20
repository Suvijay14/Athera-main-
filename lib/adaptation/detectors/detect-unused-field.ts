import { differenceInCalendarDays, parseISO } from 'date-fns'

import type { DetectionContext, SuggestionDraft } from '@/lib/adaptation/detector-types'
import { isDedupeBlocked } from '@/lib/adaptation/detector-utils'

/** Two weeks — fields need time to be ignored before we suggest hiding. */
export const UNUSED_FIELD_MIN_AGE_DAYS = 14

/** Ten items — avoid hiding based on tiny samples. */
export const UNUSED_FIELD_MIN_ITEMS = 10

/** Below 10% fill — effectively unused. */
export const UNUSED_FIELD_MAX_FILL_RATE = 0.1

function isValuePresent(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false
  }
  if (typeof value === 'string') {
    return value.trim().length > 0
  }
  return true
}

export function detectUnusedField(ctx: DetectionContext): SuggestionDraft | null {
  for (const field of ctx.fields) {
    if (!field.visible) {
      continue
    }

    const dedupeKey = `unused-field:${field.key}`
    if (isDedupeBlocked(dedupeKey, ctx.recentSuggestions)) {
      continue
    }

    const fieldAgeDays = differenceInCalendarDays(ctx.now, parseISO(field.createdAt))
    if (fieldAgeDays < UNUSED_FIELD_MIN_AGE_DAYS) {
      continue
    }

    const fieldCreated = parseISO(field.createdAt)
    const qualifying = ctx.items.filter(
      (item) => parseISO(item.createdAt).getTime() >= fieldCreated.getTime()
    )

    if (qualifying.length < UNUSED_FIELD_MIN_ITEMS) {
      continue
    }

    let filled = 0
    for (const item of qualifying) {
      if (isValuePresent(item.data[field.key])) {
        filled += 1
      }
    }

    const fillRate = filled / qualifying.length
    if (fillRate >= UNUSED_FIELD_MAX_FILL_RATE) {
      continue
    }

    return {
      type: 'unused-field',
      reason: `The “${field.label}” field is filled on ${filled} of ${qualifying.length} recent items. Hide it?`,
      evidence: {
        fieldKey: field.key,
        fillRate,
        filled,
        qualifyingCount: qualifying.length,
        fieldAgeDays,
      },
      confidence: 0.7,
      dedupeKey,
      operations: [{ op: 'set_field_visibility', key: field.key, visible: false }],
    }
  }

  return null
}
