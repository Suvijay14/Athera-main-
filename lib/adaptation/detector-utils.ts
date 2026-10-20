import { differenceInCalendarDays, parseISO } from 'date-fns'

import type { FieldDefinition, Suggestion } from '@/lib/db/schemas'

import type { SuggestionDraft } from './detector-types'

export function normalizeDedupeSet(recent: Suggestion[]): Set<string> {
  return new Set(recent.map((s) => s.dedupeKey))
}

export function isDedupeBlocked(dedupeKey: string, recent: Suggestion[]): boolean {
  return normalizeDedupeSet(recent).has(dedupeKey)
}

export function pickBestDraft(drafts: SuggestionDraft[]): SuggestionDraft | null {
  if (drafts.length === 0) {
    return null
  }
  let best = drafts[0]!
  for (let i = 1; i < drafts.length; i++) {
    const d = drafts[i]!
    if (d.confidence > best.confidence) {
      best = d
    }
  }
  return best
}

export function fieldCoversConcept(fields: FieldDefinition[], concept: string): boolean {
  const norm = concept.toLowerCase()
  return fields.some((f) => {
    const key = f.key.toLowerCase()
    const label = f.label.toLowerCase()
    return key === norm || key.includes(norm) || label.includes(norm)
  })
}

export function parseItemDate(iso: string): Date {
  return parseISO(iso)
}

export function daysBetween(a: Date, b: Date): number {
  return Math.abs(differenceInCalendarDays(a, b))
}

/** Common title openers that are not client/business names. */
export const GENERIC_ENTITY_LEADING_WORDS = new Set([
  'general',
  'weekly',
  'daily',
  'follow',
  'review',
  'update',
  'misc',
  'admin',
  'task',
])

function titleCaseToken(word: string): boolean {
  return /^[A-Z][a-z]+/.test(word) || /^[A-Z]{2,}$/.test(word)
}

/** Proper-noun-like phrases (e.g. "Rivera Plumbing"), not sentence starters like "General". */
export function qualifiesAsRepeatedEntity(entity: string): boolean {
  const tokens = entity.trim().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) {
    return false
  }
  const firstLower = tokens[0]!.toLowerCase()
  if (GENERIC_ENTITY_LEADING_WORDS.has(firstLower)) {
    return false
  }
  if (tokens.length === 1) {
    return titleCaseToken(tokens[0]!)
  }
  const titleCaseCount = tokens.filter((t) => titleCaseToken(t)).length
  return titleCaseCount >= 2
}

/** Leading 1–3 tokens before ` - ` or `:`, else two consecutive Title-Case words at the start. */
export function extractEntityFromTitle(title: string): string | null {
  const trimmed = title.trim()
  if (!trimmed) {
    return null
  }
  const dash = trimmed.indexOf(' - ')
  const colon = trimmed.indexOf(':')
  if (dash >= 0 && (colon < 0 || dash < colon)) {
    const before = trimmed.slice(0, dash).trim()
    const beforePhrase = before.split(/\s+/).slice(0, 3).join(' ')
    if (beforePhrase && qualifiesAsRepeatedEntity(beforePhrase)) {
      return beforePhrase
    }
    const after = trimmed.slice(dash + 3).trim()
    const afterPhrase = after.split(/\s+/).slice(0, 3).join(' ')
    if (afterPhrase && qualifiesAsRepeatedEntity(afterPhrase)) {
      return afterPhrase
    }
    return null
  }
  if (colon >= 0) {
    const segment = trimmed.slice(0, colon).trim()
    const phrase = segment.split(/\s+/).slice(0, 3).join(' ')
    return phrase && qualifiesAsRepeatedEntity(phrase) ? phrase : null
  }
  const words = trimmed.split(/\s+/).slice(0, 2)
  if (words.length >= 2 && titleCaseToken(words[0]!) && titleCaseToken(words[1]!)) {
    const phrase = words.join(' ')
    return qualifiesAsRepeatedEntity(phrase) ? phrase : null
  }
  return null
}

export function normalizeEntityKey(entity: string): string {
  return entity.toLowerCase().replace(/\s+/g, ' ').trim()
}
