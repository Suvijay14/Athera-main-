export type CommandBarJumpTarget =
  | { type: 'item'; id: string; title: string; score: number }
  | { type: 'space'; id: string; name: string; score: number }
  | {
      type: 'note'
      pageId: string
      ownerType: 'space' | 'entity'
      ownerId: string
      label: string
      score: number
    }

export type CommandBarSearchInput = {
  query: string
  items: { id: string; title: string }[]
  spaces: { id: string; name: string }[]
  notes?: {
    pageId: string
    ownerType: 'space' | 'entity'
    ownerId: string
    bodyText: string
    label: string
  }[]
  limit?: number
}

function scoreMatch(haystack: string, needle: string): number {
  const h = haystack.toLowerCase()
  const n = needle.toLowerCase()
  if (!n) {
    return 0
  }
  if (h === n) {
    return 100
  }
  if (h.startsWith(n)) {
    return 80
  }
  const idx = h.indexOf(n)
  if (idx >= 0) {
    return 60 - Math.min(idx, 20)
  }
  return 0
}

/**
 * Case-insensitive substring ranking for command-bar jump results.
 */
export function rankCommandBarJumpTargets(input: CommandBarSearchInput): CommandBarJumpTarget[] {
  const limit = input.limit ?? 8
  const query = input.query.trim()
  if (!query) {
    const spaces = input.spaces.slice(0, 2).map((s) => ({
      type: 'space' as const,
      id: s.id,
      name: s.name,
      score: 1,
    }))
    const items = input.items.slice(0, limit - spaces.length).map((item) => ({
      type: 'item' as const,
      id: item.id,
      title: item.title,
      score: 1,
    }))
    return [...spaces, ...items]
  }

  const scored: CommandBarJumpTarget[] = []
  for (const space of input.spaces) {
    const score = scoreMatch(space.name, query)
    if (score > 0) {
      scored.push({ type: 'space', id: space.id, name: space.name, score })
    }
  }
  for (const item of input.items) {
    const score = scoreMatch(item.title, query)
    if (score > 0) {
      scored.push({ type: 'item', id: item.id, title: item.title, score })
    }
  }
  for (const note of input.notes ?? []) {
    const score = scoreMatch(note.bodyText, query)
    if (score > 0) {
      scored.push({
        type: 'note',
        pageId: note.pageId,
        ownerType: note.ownerType,
        ownerId: note.ownerId,
        label: note.label,
        score,
      })
    }
  }

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit)
}

export function shouldPreferCreateOverJump(
  query: string,
  jumpResults: CommandBarJumpTarget[]
): boolean {
  const trimmed = query.trim()
  if (!trimmed) {
    return false
  }
  if (jumpResults.length === 0) {
    return true
  }
  const best = jumpResults[0]?.score ?? 0
  return best < 70
}
