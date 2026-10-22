/**
 * CLI diagnostics for adaptation (Node-safe). Does not mutate the workspace.
 */
import type { DbClient } from '@/lib/db/db-client'
import { listFields } from '@/lib/db/fields'
import { listExtractionsForWorkspaceSince } from '@/lib/db/item-entity-extractions'
import { listItems } from '@/lib/db/items'
import { listRecurrenceRules } from '@/lib/db/recurrence-rules'
import { listRecentSuggestionsForDetection } from '@/lib/db/suggestions'
import { listViews } from '@/lib/db/views'
import { subDays } from 'date-fns'

import type { DetectionContext } from './detector-types'
import { isWorkspaceInFirstWeek } from './workspace-age'
import { DETECTORS_IN_ORDER } from './detectors'
import { isDedupeBlocked } from './detector-utils'
import { detectCalendarView } from './detectors/detect-calendar-view'
import { detectRepeatedEntity } from './detectors/detect-repeated-entity'
import { detectRepeat } from './detectors/detect-repeat'
import { detectStatusInNotes } from './detectors/detect-status-in-notes'
import { detectUnusedField } from './detectors/detect-unused-field'
import {
  buildCandidatesFromExtractions,
  hasEntityFieldForKind,
  REPEATED_ENTITY_CONFIDENCE_THRESHOLD,
  REPEATED_ENTITY_ITEM_THRESHOLD,
} from './entity-repeated-logic'
import { selectDraftForPersistence } from './select-draft'

export type DetectorDiagnosis = {
  name: string
  fired: boolean
  dedupeKey?: string
  confidence?: number
  lines: string[]
}

function diagnoseRepeatedEntity(ctx: DetectionContext): DetectorDiagnosis {
  const lines: string[] = []
  const extractions = ctx.itemExtractions ?? []
  lines.push(`item_entity_extractions in context: ${extractions.length} row(s)`)

  if (extractions.length === 0) {
    lines.push('→ null: no extraction rows (post-save LLM job may not have run or failed).')
    return { name: 'repeated-entity', fired: false, lines }
  }

  const candidates = buildCandidatesFromExtractions(ctx.items, extractions, ctx.now)
  if (candidates.length === 0) {
    lines.push('→ null: no candidates (extractions not tied to items in the 21-day window).')
    return { name: 'repeated-entity', fired: false, lines }
  }

  for (const bucket of candidates) {
    lines.push(`space ${bucket.spaceId} kind "${bucket.kind}":`)
    for (const [norm, entry] of bucket.byName.entries()) {
      lines.push(
        `  • "${entry.display}" (norm=${norm}): ${entry.itemIds.length} item(s), confidences=[${entry.confidences.join(', ')}]`
      )
    }

    if (hasEntityFieldForKind(ctx.fields, bucket.kind)) {
      lines.push(`  → skip: entity-type field already exists for kind "${bucket.kind}".`)
      continue
    }
    lines.push(`  entity-type field for kind: none (text "client" does not block).`)

    const qualifying = [...bucket.byName.entries()].filter(([, v]) => v.itemIds.length >= 2)
    if (qualifying.length < 2) {
      lines.push(
        `  → fail: need ≥2 distinct entity names with ≥2 items each; only ${qualifying.length} qualifying name(s).`
      )
      continue
    }

    const primary = qualifying.sort((a, b) => b[1].itemIds.length - a[1].itemIds.length)[0]!
    const [, primaryEntry] = primary
    if (primaryEntry.itemIds.length < REPEATED_ENTITY_ITEM_THRESHOLD) {
      lines.push(
        `  → fail: primary "${primaryEntry.display}" has ${primaryEntry.itemIds.length} item(s); need ≥${REPEATED_ENTITY_ITEM_THRESHOLD}.`
      )
      continue
    }

    const avgConf =
      primaryEntry.confidences.reduce((s, c) => s + c, 0) / primaryEntry.confidences.length
    const confidence = avgConf * Math.min(1, primaryEntry.itemIds.length / 6)
    lines.push(
      `  primary "${primaryEntry.display}": avgConf=${avgConf.toFixed(3)}, count factor=min(1,${primaryEntry.itemIds.length}/6)=${Math.min(1, primaryEntry.itemIds.length / 6).toFixed(3)}, confidence=${confidence.toFixed(3)} (threshold ${REPEATED_ENTITY_CONFIDENCE_THRESHOLD}).`
    )
    if (confidence < REPEATED_ENTITY_CONFIDENCE_THRESHOLD) {
      lines.push('  → fail: confidence below threshold.')
    }
  }

  const draft = detectRepeatedEntity(ctx)
  if (draft) {
    lines.push(`→ fired: dedupeKey=${draft.dedupeKey}, confidence=${draft.confidence}.`)
    return {
      name: 'repeated-entity',
      fired: true,
      dedupeKey: draft.dedupeKey,
      confidence: draft.confidence,
      lines,
    }
  }
  lines.push('→ null: pickRepeatedEntityCandidate returned null (see gates above).')
  return { name: 'repeated-entity', fired: false, lines }
}

function diagnoseSimple(
  name: string,
  ctx: DetectionContext,
  detect: (c: DetectionContext) => ReturnType<typeof detectRepeatedEntity>,
  hints: string[]
): DetectorDiagnosis {
  const draft = detect(ctx)
  const lines = [...hints]
  if (draft) {
    if (isDedupeBlocked(draft.dedupeKey, ctx.recentSuggestions)) {
      lines.push(`→ would fire but dedupeKey "${draft.dedupeKey}" is blocked by recent suggestions.`)
      return { name, fired: false, dedupeKey: draft.dedupeKey, lines }
    }
    lines.push(`→ fired: dedupeKey=${draft.dedupeKey}, confidence=${draft.confidence}.`)
    return {
      name,
      fired: true,
      dedupeKey: draft.dedupeKey,
      confidence: draft.confidence,
      lines,
    }
  }
  lines.push('→ null: detector returned null (thresholds not met or already adapted).')
  return { name, fired: false, lines }
}

export async function buildDetectionContext(
  client: DbClient,
  workspaceId: string,
  now = new Date()
): Promise<DetectionContext> {
  const since = subDays(now, 21).toISOString()
  const { listSpaces } = await import('@/lib/db/spaces')
  const [fields, itemsResult, spaces, views, recurrenceRules, recentSuggestions, itemExtractions, workspaceRow] =
    await Promise.all([
      listFields(client, workspaceId),
      listItems(client, workspaceId, { limit: 500 }),
      listSpaces(client, workspaceId),
      listViews(client, workspaceId),
      listRecurrenceRules(client, workspaceId),
      listRecentSuggestionsForDetection(client, workspaceId, now),
      listExtractionsForWorkspaceSince(client, workspaceId, since),
      client.from('workspaces').select('created_at').eq('id', workspaceId).single(),
    ])

  const workspaceCreatedAt = workspaceRow.data?.created_at ?? now.toISOString()

  return {
    workspaceId,
    workspaceCreatedAt,
    isFirstWeek: isWorkspaceInFirstWeek(workspaceCreatedAt, now),
    items: itemsResult.items,
    spaces,
    fields,
    views,
    recurrenceRules,
    recentSuggestions,
    itemExtractions,
    now,
  }
}

export function diagnoseAllDetectors(ctx: DetectionContext): DetectorDiagnosis[] {
  return [
    diagnoseRepeatedEntity(ctx),
    diagnoseSimple('calendar-view', ctx, detectCalendarView, [
      `Needs ≥8 items in a space with ≥60% dated, and no calendar view yet.`,
    ]),
    diagnoseSimple('status-in-notes', ctx, detectStatusInNotes, [
      'Looks for status-like words in notes when no status field exists.',
    ]),
    diagnoseSimple('repeat-pattern', ctx, detectRepeat, [
      'Looks for similar titles on a regular interval.',
    ]),
    diagnoseSimple('unused-field', ctx, detectUnusedField, [
      'Looks for visible custom fields with very low fill rate (≥14 days old).',
    ]),
  ]
}

export function formatAdaptationDiagnosis(
  ctx: DetectionContext,
  diagnoses: DetectorDiagnosis[]
): string {
  const drafts = DETECTORS_IN_ORDER.map((d) => d(ctx)).filter(
    (d): d is NonNullable<typeof d> => d !== null
  )
  const chosen = selectDraftForPersistence(drafts, ctx.recentSuggestions)
  const blocked = drafts.filter((d) => isDedupeBlocked(d.dedupeKey, ctx.recentSuggestions))

  const out: string[] = [
    '--- Adaptation diagnosis ---',
    `workspaceId: ${ctx.workspaceId}`,
    `items: ${ctx.items.length}, fields: ${ctx.fields.length}, extractions (21d): ${ctx.itemExtractions?.length ?? 0}`,
    `recent suggestions (pending/shown/accepted + dismissed 30d): ${ctx.recentSuggestions.length}`,
    '',
  ]

  for (const d of diagnoses) {
    out.push(`[${d.name}] ${d.fired ? 'FIRED' : 'silent'}`)
    out.push(...d.lines.map((l) => `  ${l}`))
    out.push('')
  }

  out.push(`Drafts from detectors: ${drafts.length}`)
  for (const d of drafts) {
    out.push(`  • ${d.type} dedupe=${d.dedupeKey} confidence=${d.confidence}`)
  }
  if (blocked.length > 0) {
    out.push(`Dedupe-blocked drafts: ${blocked.length}`)
    for (const d of blocked) {
      out.push(`  • ${d.type} dedupe=${d.dedupeKey}`)
    }
  }
  out.push(
    chosen
      ? `selectDraftForPersistence → ${chosen.type} (${chosen.dedupeKey}, confidence=${chosen.confidence})`
      : 'selectDraftForPersistence → null (no draft or all dedupe-blocked)'
  )
  out.push(
    'Note: insertPendingSuggestion can still return null if dedupe_key already exists as pending in DB (unique constraint).'
  )
  return out.join('\n')
}

export async function runAdaptationDiagnosis(
  client: DbClient,
  workspaceId: string
): Promise<string> {
  const ctx = await buildDetectionContext(client, workspaceId)
  const diagnoses = diagnoseAllDetectors(ctx)
  return formatAdaptationDiagnosis(ctx, diagnoses)
}
