/** Normalized title for repeat detection (spec: lowercase, strip dates/times/punctuation). */
export function normalizeRepeatTitle(title: string): string {
  let s = title.toLowerCase()
  s = s.replace(/\b\d{1,2}[/-]\d{1,2}([/-]\d{2,4})?\b/g, ' ')
  s = s.replace(/\b\d{1,2}:\d{2}\s*(am|pm)?\b/gi, ' ')
  s = s.replace(/[^\p{L}\p{N}\s]/gu, ' ')
  s = s.replace(/\s+/g, ' ').trim()
  return s
}

// Fast-follow: embedding similarity >= 0.85 (pgvector) for titles that differ cosmetically.
