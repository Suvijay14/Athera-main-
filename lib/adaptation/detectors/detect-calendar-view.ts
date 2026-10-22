import type { DetectionContext, SuggestionDraft } from '@/lib/adaptation/detector-types'
import { isDedupeBlocked } from '@/lib/adaptation/detector-utils'
import { buildChildSpacesByParentId } from '@/lib/workspace/space-hierarchy'

/** Task 19: first-week cold start — 3 dated items can suggest calendar. */
export const CALENDAR_VIEW_MIN_ITEMS_FIRST_WEEK = 3

/** Spec 1c: enough items in a space to justify a calendar. */
export const CALENDAR_VIEW_MIN_ITEMS = 8

/** Spec 1c: majority of items should already carry a date or time. */
export const CALENDAR_VIEW_MIN_DATED_RATE = 0.6

export const CALENDAR_VIEW_CONFIDENCE = 0.85

function isDatedItem(item: { startAt: string | null; dueDate: string | null }): boolean {
  return Boolean(item.startAt?.trim()) || Boolean(item.dueDate?.trim())
}

function isOpenItem(item: { completedAt: string | null; archivedAt: string | null }): boolean {
  return !item.completedAt && !item.archivedAt
}

function defaultColorByField(ctx: DetectionContext): string | null {
  const grouped = ctx.views.find((v) => v.type === 'grouped' && v.groupByField)
  if (grouped?.groupByField) {
    return grouped.groupByField
  }
  const entityField = ctx.fields.find((f) => f.type === 'entity' && f.visible)
  if (entityField) {
    return entityField.key
  }
  const selectField = ctx.fields.find((f) => f.type === 'select' && f.visible)
  return selectField?.key ?? null
}

export function detectCalendarView(ctx: DetectionContext): SuggestionDraft | null {
  if (ctx.views.some((v) => v.type === 'calendar' && v.visible)) {
    return null
  }

  const childByParent = buildChildSpacesByParentId(ctx.spaces)
  const spacesById = new Map(ctx.spaces.map((s) => [s.id, s]))

  const byRootSpace = new Map<string, typeof ctx.items>()
  for (const item of ctx.items) {
    if (!isOpenItem(item)) {
      continue
    }
    let rootId = item.spaceId
    let space = spacesById.get(item.spaceId)
    while (space?.parentSpaceId) {
      const parent = spacesById.get(space.parentSpaceId)
      if (!parent) {
        break
      }
      rootId = parent.id
      space = parent
    }
    const list = byRootSpace.get(rootId) ?? []
    list.push(item)
    byRootSpace.set(rootId, list)
  }

  let best: { spaceId: string; spaceName: string; total: number; dated: number } | null = null

  const minItems = ctx.isFirstWeek ? CALENDAR_VIEW_MIN_ITEMS_FIRST_WEEK : CALENDAR_VIEW_MIN_ITEMS

  for (const [spaceId, spaceItems] of byRootSpace) {
    if (spaceItems.length < minItems) {
      continue
    }
    const dated = spaceItems.filter(isDatedItem).length
    const rate = dated / spaceItems.length
    if (rate < CALENDAR_VIEW_MIN_DATED_RATE) {
      continue
    }
    const spaceName = spacesById.get(spaceId)?.name ?? 'this space'
    if (!best || dated > best.dated) {
      best = { spaceId, spaceName, total: spaceItems.length, dated }
    }
  }

  if (!best) {
    return null
  }

  const dedupeKey = `calendar-view:${best.spaceId}`
  if (isDedupeBlocked(dedupeKey, ctx.recentSuggestions)) {
    return null
  }

  const colorBy = defaultColorByField(ctx)

  return {
    type: 'calendar-view',
    reason: `Most of your work has times. See it on a calendar?`,
    evidence: {
      spaceId: best.spaceId,
      spaceName: best.spaceName,
      datedCount: best.dated,
      totalCount: best.total,
      datedRate: best.dated / best.total,
    },
    confidence: CALENDAR_VIEW_CONFIDENCE,
    dedupeKey,
    operations: [
      {
        op: 'create_view',
        view: {
          name: 'Calendar',
          type: 'calendar',
          calendarRange: 'week',
          colorByField: colorBy ?? undefined,
        },
      },
    ],
  }
}
