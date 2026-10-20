import { SuggestionStateError } from '@/lib/adaptation/errors'
import { describe } from '@/lib/adaptation/operations'
import type { Operation } from '@/lib/adaptation/types'
import { operationsSchema } from '@/lib/adaptation/types'

export type SuggestionPreview = {
  summary: string
  operationDescriptions: string[]
  affectedItemCount: number
  sampleItems: { id: string; title: string }[]
}

function evidenceCount(evidence: Record<string, unknown>): number | null {
  const count = evidence.count
  return typeof count === 'number' && Number.isFinite(count) ? count : null
}

function evidenceItemIds(evidence: Record<string, unknown>): string[] {
  const raw = evidence.itemIds
  if (!Array.isArray(raw)) {
    return []
  }
  return raw.filter((id): id is string => typeof id === 'string')
}

export function buildSuggestionPreview(
  operations: Operation[],
  evidence: Record<string, unknown>,
  itemTitlesById: Map<string, string>
): SuggestionPreview {
  const operationDescriptions = operations.map((op) => describe(op))

  let affectedItemCount = 0
  for (const op of operations) {
    if (op.op === 'backfill_field') {
      affectedItemCount = Math.max(affectedItemCount, Object.keys(op.values).length)
    }
  }
  if (affectedItemCount === 0) {
    affectedItemCount = evidenceCount(evidence) ?? 0
  }

  const idCandidates = [
    ...evidenceItemIds(evidence),
    ...operations.flatMap((op) =>
      op.op === 'backfill_field' ? Object.keys(op.values) : []
    ),
  ]
  const seen = new Set<string>()
  const sampleItems: { id: string; title: string }[] = []
  for (const id of idCandidates) {
    if (seen.has(id)) {
      continue
    }
    seen.add(id)
    const title = itemTitlesById.get(id)
    if (title) {
      sampleItems.push({ id, title })
    }
    if (sampleItems.length >= 3) {
      break
    }
  }

  const summary =
    operationDescriptions.length > 0
      ? operationDescriptions.join(', ')
      : 'Update your workspace'

  return {
    summary,
    operationDescriptions,
    affectedItemCount,
    sampleItems,
  }
}

export function parseSuggestionOperations(operations: unknown): Operation[] {
  return operationsSchema.parse(operations)
}

export function assertPreviewableSuggestionStatus(status: string): void {
  if (status !== 'pending' && status !== 'shown') {
    throw new SuggestionStateError(`Cannot preview suggestion in status "${status}"`)
  }
}
