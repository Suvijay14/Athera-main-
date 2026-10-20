import type { DetectionContext, SuggestionDraft } from '@/lib/adaptation/detector-types'
import {
  buildCandidatesFromExtractions,
  pickRepeatedEntityCandidate,
} from '@/lib/adaptation/entity-repeated-logic'
import { isDedupeBlocked } from '@/lib/adaptation/detector-utils'
import { ENTITY_FIELD_COLORS } from '@/lib/adaptation/entity-colors'

function fieldKeyForKind(kind: string): string {
  return kind.toLowerCase().replace(/[^a-z0-9_]/g, '_') || 'contact'
}

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

  const fieldKey = fieldKeyForKind(picked.kind)
  const n = picked.itemCount
  const displayName = picked.primaryName

  const uniqueNames = [...new Set(Object.values(picked.backfillValues))]

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
    operations: [
      {
        op: 'create_field',
        field: {
          key: fieldKey,
          label: labelForKind(picked.kind),
          type: 'entity',
          entityKind: picked.kind,
        },
      },
      ...uniqueNames.map((name, i) => ({
        op: 'create_entity' as const,
        entity: {
          spaceId: picked.spaceId,
          kind: picked.kind,
          name,
          color: ENTITY_FIELD_COLORS[i % ENTITY_FIELD_COLORS.length] ?? '#6366f1',
        },
      })),
      {
        op: 'backfill_field',
        key: fieldKey,
        values: picked.backfillValues,
      },
      {
        op: 'create_view',
        view: {
          name: `${labelForKind(picked.kind)}s`,
          type: 'grouped',
          groupByField: fieldKey,
        },
      },
    ],
  }
}
