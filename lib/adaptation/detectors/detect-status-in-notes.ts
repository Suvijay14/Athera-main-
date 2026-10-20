import type { DetectionContext, SuggestionDraft } from '@/lib/adaptation/detector-types'
import { isDedupeBlocked } from '@/lib/adaptation/detector-utils'

/** Five notes — status vocabulary should be repeated, not one-off wording. */
export const STATUS_WORD_THRESHOLD = 5

const SEED_STATUS_WORDS = [
  'paid',
  'pending',
  'sent',
  'invoiced',
  'waiting',
  'done',
  'overdue',
  'scheduled',
  'unpaid',
  'approved',
] as const

const FIELD_KEY = 'status'
const DEDUPE_KEY = 'status-in-notes'

function wordRegex(word: string): RegExp {
  return new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
}

function firstStatusInNotes(notes: string | null, vocabulary: Set<string>): string | null {
  if (!notes) {
    return null
  }
  const lower = notes.toLowerCase()
  if (lower.includes('invoice sent')) {
    if (vocabulary.has('sent') || vocabulary.has('invoice sent')) {
      return 'sent'
    }
  }
  for (const word of vocabulary) {
    if (word === 'invoice sent') {
      continue
    }
    if (wordRegex(word).test(notes)) {
      return word
    }
  }
  return null
}

function hasStatusSelectField(ctx: DetectionContext): boolean {
  return ctx.fields.some(
    (f) =>
      f.type === 'select' &&
      (f.key === FIELD_KEY || f.label.toLowerCase().includes('status'))
  )
}

export function detectStatusInNotes(ctx: DetectionContext): SuggestionDraft | null {
  if (isDedupeBlocked(DEDUPE_KEY, ctx.recentSuggestions)) {
    return null
  }
  if (hasStatusSelectField(ctx)) {
    return null
  }

  const dynamicCounts = new Map<string, number>()

  for (const item of ctx.items) {
    if (!item.notes) {
      continue
    }
    const tokens = item.notes.toLowerCase().match(/\b[a-z]{2,15}\b/g) ?? []
    for (const t of tokens) {
      if (SEED_STATUS_WORDS.includes(t as (typeof SEED_STATUS_WORDS)[number])) {
        continue
      }
      dynamicCounts.set(t, (dynamicCounts.get(t) ?? 0) + 1)
    }
  }

  const vocabulary = new Set<string>(SEED_STATUS_WORDS)
  for (const [word, count] of dynamicCounts.entries()) {
    if (word.length <= 15 && count >= STATUS_WORD_THRESHOLD) {
      vocabulary.add(word)
    }
  }

  const backfillValues: Record<string, string> = {}
  const valueCounts = new Map<string, number>()

  for (const item of ctx.items) {
    const matched = firstStatusInNotes(item.notes, vocabulary)
    if (matched) {
      backfillValues[item.id] = matched
      valueCounts.set(matched, (valueCounts.get(matched) ?? 0) + 1)
    }
  }

  const matchedItemCount = Object.keys(backfillValues).length
  if (matchedItemCount < STATUS_WORD_THRESHOLD) {
    return null
  }

  const options = [...new Set(Object.values(backfillValues))].sort()
  const topWord = [...valueCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'status'

  return {
    type: 'status-in-notes',
    reason: `You've used words like "${topWord}" in ${matchedItemCount} notes. Add a Status field?`,
    evidence: {
      matchedItemCount,
      options,
      sampleWord: topWord,
    },
    confidence: Math.min(0.9, 0.5 + matchedItemCount * 0.04),
    dedupeKey: DEDUPE_KEY,
    operations: [
      {
        op: 'create_field',
        field: {
          key: FIELD_KEY,
          label: 'Status',
          type: 'select',
          options,
        },
      },
      { op: 'backfill_field', key: FIELD_KEY, values: backfillValues },
    ],
  }
}
