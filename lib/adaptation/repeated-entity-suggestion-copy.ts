import type { Operation } from '@/lib/adaptation/types'
import { parseSuggestionOperations } from '@/lib/adaptation/preview-build'

export type EntityCountPill = { name: string; count: number }

export function entityCountPillsFromOperations(operations: Operation[]): EntityCountPill[] {
  const backfill = operations.find((o) => o.op === 'backfill_field')
  if (!backfill || backfill.op !== 'backfill_field') {
    return []
  }
  const counts = new Map<string, number>()
  for (const name of Object.values(backfill.values)) {
    if (typeof name !== 'string' || !name.trim()) {
      continue
    }
    const display = name.trim()
    counts.set(display, (counts.get(display) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

export function groupByCtaFromOperations(operations: Operation[]): string {
  const fieldOp = operations.find((o) => o.op === 'create_field')
  if (fieldOp && fieldOp.op === 'create_field') {
    return `Group by ${fieldOp.field.label.toLowerCase()}`
  }
  return 'Group items'
}

export function repeatedEntityHeadline(
  evidence: Record<string, unknown>,
  kind: string
): string {
  const primary = typeof evidence.entity === 'string' ? evidence.entity : 'This name'
  const count = typeof evidence.count === 'number' ? evidence.count : 0
  const kindLabel = kind.toLowerCase() === 'client' ? 'client' : kind
  return `${primary} shows up in ${count} things this week. Group your work by ${kindLabel}?`
}

export function repeatedEntityReasoningLine(
  pills: EntityCountPill[],
  primaryName: string
): string {
  if (pills.length === 0) {
    return ''
  }
  const primary = pills.find((p) => p.name === primaryName) ?? pills[0]
  if (!primary) {
    return ''
  }
  const others = pills.filter((p) => p.name !== primary.name).map((p) => p.name)
  if (others.length === 0) {
    return `Based on ${primary.count} items naming ${primary.name}.`
  }
  return `Based on ${primary.count} items naming ${primary.name}, plus ${others.join(' and ')}.`
}

export function parseSuggestionOps(raw: unknown): Operation[] {
  return parseSuggestionOperations(raw)
}
