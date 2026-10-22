import type { DetectionContext, SuggestionDraft } from '@/lib/adaptation/detector-types'
import {
  buildCandidatesFromExtractions,
  pickRepeatedEntityCandidate,
} from '@/lib/adaptation/entity-repeated-logic'
import { isDedupeBlocked } from '@/lib/adaptation/detector-utils'
import { buildRepeatedEntityOperations } from '@/lib/adaptation/build-repeated-entity-operations'

function labelForKind(kind: string): string {
  const k = kind.toLowerCase()
  if (k === 'client') return 'Client'
  if (k === 'patient') return 'Patient'
  if (k === 'vendor') return 'Vendor'
  if (k === 'student') return 'Student'
  return k.charAt(0).toUpperCase() + k.slice(1)
}

export function detectRepeatedEntity(ctx: DetectionContext): SuggestionDraft | null {
  const extractions = ctx.itemExtractions ?? []
  if (extractions.length === 0) {
    return null
  }

  const candidates = buildCandidatesFromExtractions(ctx.items, extractions, ctx.now)
  const picked = pickRepeatedEntityCandidate(candidates, ctx.fields, {
    firstWeek: ctx.isFirstWeek,
  })
  if (!picked) {
    return null
  }

  const dedupeKey = `repeated-entity:${picked.kind}:${picked.spaceId}`
  if (isDedupeBlocked(dedupeKey, ctx.recentSuggestions)) {
    return null
  }

  const n = picked.itemCount
  const displayName = picked.primaryName

  return {
    type: 'repeated-entity',
    reason: `You've added ${n} items mentioning ${displayName} (and ${picked.distinctEntityCount - 1} other ${picked.kind}s). Want a ${labelForKind(picked.kind)}s view?`,
    evidence: {
      entity: displayName,
      kind: picked.kind,
      spaceId: picked.spaceId,
      count: n,
      names: picked.evidenceNames,
    },
    confidence: picked.confidence,
    dedupeKey,
    operations: buildRepeatedEntityOperations(picked),
  }
}
