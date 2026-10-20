import 'server-only'

import type { DbClient } from '@/lib/db/db-client'
import { listRecentSpaceMoveCorrections } from '@/lib/db/space-move-corrections'
import { getDefaultSpaceId } from '@/lib/db/spaces'
import type { Entity, Space, WorkItem } from '@/lib/db/schemas'
import { classifyItemSpace, type SpaceExampleForPrompt } from '@/lib/llm/classify-space'
import { entityFieldKeys } from '@/lib/workspace/entity-items'

import { resolveEntitySpaceOnCreate } from './entity-match-on-create'
import { SPACE_ASSIGN_CONFIDENCE_THRESHOLD } from './item-space-state'

export type ItemCreateSpaceContext = {
  /** Space id from the UI when creating inside a space view (not Overview). */
  contextSpaceId: string | null
  /** True when quick-add runs on a space page (hard rule: use contextSpaceId). */
  fromSpaceView: boolean
  source?: WorkItem['source']
  /** Set when materializing or creating from a recurrence rule. */
  recurrenceSpaceId?: string | null
}

export type ResolveItemSpaceResult = {
  spaceId: string
  confidence: number | null
  method: 'hard-rule' | 'classified' | 'unsorted'
}

export type ResolveItemSpaceHardRuleInput = {
  title: string
  data: Record<string, unknown>
  ctx: ItemCreateSpaceContext
  entities: Entity[]
  entityKeys: string[]
  defaultSpaceId: string
}

/** Pure hard-rule resolution; returns null when classification should run. */
export function resolveItemSpaceHardRule(input: ResolveItemSpaceHardRuleInput): ResolveItemSpaceResult | null {
  const { ctx, entities, entityKeys, data, title, defaultSpaceId } = input

  if (ctx.fromSpaceView && ctx.contextSpaceId) {
    return { spaceId: ctx.contextSpaceId, confidence: null, method: 'hard-rule' }
  }

  if (ctx.source === 'recurrence' && ctx.recurrenceSpaceId) {
    return { spaceId: ctx.recurrenceSpaceId, confidence: null, method: 'hard-rule' }
  }

  const entitySpaceId = resolveEntitySpaceOnCreate(title, data, entityKeys, entities)
  if (entitySpaceId) {
    return { spaceId: entitySpaceId, confidence: null, method: 'hard-rule' }
  }

  void defaultSpaceId
  return null
}

function recentTitlesBySpace(items: WorkItem[], spaceIds: string[]): Map<string, string[]> {
  const map = new Map<string, string[]>()
  for (const id of spaceIds) {
    map.set(id, [])
  }
  const sorted = [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  for (const item of sorted) {
    const list = map.get(item.spaceId)
    if (list && list.length < 5) {
      list.push(item.title)
    }
  }
  return map
}

export function applyClassificationThreshold(
  classification: { space_id: string; confidence: number },
  defaultSpaceId: string
): ResolveItemSpaceResult {
  if (classification.confidence >= SPACE_ASSIGN_CONFIDENCE_THRESHOLD) {
    return {
      spaceId: classification.space_id,
      confidence: classification.confidence,
      method: 'classified',
    }
  }
  return {
    spaceId: defaultSpaceId,
    confidence: classification.confidence,
    method: 'unsorted',
  }
}

export async function resolveItemSpaceForCreate(
  client: DbClient,
  workspaceId: string,
  title: string,
  data: Record<string, unknown>,
  ctx: ItemCreateSpaceContext,
  deps: {
    spaces: Space[]
    items: WorkItem[]
    entities: Entity[]
    fields: Awaited<ReturnType<typeof import('@/lib/db/fields').listFields>>
  }
): Promise<ResolveItemSpaceResult> {
  const activeSpaces = deps.spaces.filter((s) => !s.archivedAt)
  const defaultSpaceId = await getDefaultSpaceId(client, workspaceId)
  const keys = entityFieldKeys(deps.fields)

  const hard = resolveItemSpaceHardRule({
    title,
    data,
    ctx,
    entities: deps.entities,
    entityKeys: keys,
    defaultSpaceId,
  })
  if (hard) {
    return hard
  }

  const classifiable = activeSpaces.filter((s) => !s.isDefault)
  if (classifiable.length < 1 || activeSpaces.length < 2) {
    return { spaceId: defaultSpaceId, confidence: null, method: 'hard-rule' }
  }

  const titlesBySpace = recentTitlesBySpace(deps.items, activeSpaces.map((s) => s.id))
  const examples: SpaceExampleForPrompt[] = activeSpaces.map((s) => ({
    id: s.id,
    name: s.name,
    recentTitles: titlesBySpace.get(s.id) ?? [],
  }))

  const corrections = await listRecentSpaceMoveCorrections(client, workspaceId, 20)
  const classification = await classifyItemSpace(title, examples, corrections)
  return applyClassificationThreshold(classification, defaultSpaceId)
}
