import 'server-only'

import { countActiveAdaptations, listChangeLog } from '@/lib/db/change-log'
import { countItemsBySpace, listItems } from '@/lib/db/items'
import { listRecurrenceRules } from '@/lib/db/recurrence-rules'
import { listFields } from '@/lib/db/fields'
import { listEntitiesForWorkspace } from '@/lib/db/entities'
import { getSpaceById, listSpaces } from '@/lib/db/spaces'
import { getPendingSuggestion } from '@/lib/db/suggestions'
import { listViews } from '@/lib/db/views'
import { addMonths, subMonths } from 'date-fns'

import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/supabase/get-current-workspace'
import { mergeWorkItemsWithRecurrenceInstances } from '@/lib/workspace/merge-recurrence-display-items'
import { computeQuietEntityDetails } from '@/lib/workspace/compute-quiet-entity-ids'
import { rollupItemCountsBySpace, spaceTreeIds, buildChildSpacesByParentId } from '@/lib/workspace/space-hierarchy'

async function loadWorkspaceCore(client: Awaited<ReturnType<typeof createClient>>, workspaceId: string) {
  const [fields, views, spacesInitial, pendingSuggestion, activeAdaptationCount, changeLog, itemCounts] =
    await Promise.all([
      listFields(client, workspaceId),
      listViews(client, workspaceId),
      listSpaces(client, workspaceId, { includeArchived: true }),
      getPendingSuggestion(client, workspaceId),
      countActiveAdaptations(client, workspaceId),
      listChangeLog(client, workspaceId, 20),
      countItemsBySpace(client, workspaceId),
    ])

  let spaces = spacesInitial
  if (spaces.length === 0) {
    const { error: bootstrapError } = await client.rpc('ensure_workspace_for_user')
    if (!bootstrapError) {
      spaces = await listSpaces(client, workspaceId, { includeArchived: true })
    }
  }

  const defaultSpace = spaces.find((s) => s.isDefault) ?? spaces[0] ?? null
  if (!defaultSpace) {
    throw new Error('Default space missing for workspace')
  }
  const activeChanges = changeLog.filter((e) => e.undoneAt === null)
  return {
    fields,
    views: views.filter((v) => v.visible),
    spaces,
    defaultSpace,
    pendingSuggestion,
    activeAdaptationCount,
    activeChanges,
    itemCountsBySpace: rollupItemCountsBySpace(itemCounts, spaces),
  }
}

export async function loadWorkspaceShellData() {
  const ctx = await getCurrentWorkspace()
  const client = await createClient()
  const core = await loadWorkspaceCore(client, ctx.workspace.id)
  const { data: jumpRows } = await client
    .from('work_items')
    .select('id, title, space_id, start_at, due_date')
    .eq('workspace_id', ctx.workspace.id)
    .order('updated_at', { ascending: false })
    .limit(300)
  const jumpItems = (jumpRows ?? []).map((r) => ({
    id: r.id as string,
    title: r.title as string,
    spaceId: r.space_id as string,
    startAt: (r.start_at as string | null) ?? null,
    dueDate: (r.due_date as string | null) ?? null,
  }))
  const [entities, itemsForQuiet, recurrenceRules] = await Promise.all([
    listEntitiesForWorkspace(client, ctx.workspace.id),
    listItems(client, ctx.workspace.id, { limit: 2000 }),
    listRecurrenceRules(client, ctx.workspace.id),
  ])
  const now = new Date()
  const quietDetails = computeQuietEntityDetails(
    entities,
    itemsForQuiet.items,
    core.fields,
    recurrenceRules,
    now
  )
  const quietEntityIds = quietDetails.map((q) => q.entityId)
  const quietEntityWeeks = Object.fromEntries(
    quietDetails.map((q) => [q.entityId, q.weeksQuiet])
  )
  let notePages: { pageId: string; ownerType: string; ownerId: string; bodyText: string }[] = []
  try {
    const { listPagesForWorkspace } = await import('@/lib/db/pages')
    notePages = await listPagesForWorkspace(client, ctx.workspace.id)
  } catch {
    notePages = []
  }
  return {
    ...ctx,
    ...core,
    jumpItems,
    entities,
    notePages,
    quietEntityIds,
    quietEntityWeeks,
    defaultSpaceId: core.defaultSpace.id,
  }
}

export async function loadSpacePageData(spaceId: string) {
  const ctx = await getCurrentWorkspace()
  const client = await createClient()
  const core = await loadWorkspaceCore(client, ctx.workspace.id)
  const space = await getSpaceById(client, ctx.workspace.id, spaceId)
  if (!space || space.archivedAt) {
    return null
  }
  const childByParent = buildChildSpacesByParentId(core.spaces)
  const treeSpaceIds = spaceTreeIds(space.id, childByParent)
  const loadSpaceIds = treeSpaceIds.length > 1 ? treeSpaceIds : [space.id]
  const [itemsResult, entitiesAll, recurrenceRules, calendarConnection] = await Promise.all([
    listItems(client, ctx.workspace.id, { spaceIds: loadSpaceIds, limit: 500 }),
    listEntitiesForWorkspace(client, ctx.workspace.id),
    listRecurrenceRules(client, ctx.workspace.id),
    (async () => {
      try {
        const { getCalendarConnectionForSpace } = await import('@/lib/db/calendar-connections')
        return getCalendarConnectionForSpace(client, ctx.workspace.id, space.id)
      } catch {
        return null
      }
    })(),
  ])
  const entities = entitiesAll.filter((e) => loadSpaceIds.includes(e.spaceId))
  const childSpaces = childByParent.get(space.id) ?? []
  const now = new Date()
  const spaceRules = recurrenceRules.filter(
    (r) => loadSpaceIds.includes(r.spaceId) && r.active
  )
  const displayItems = mergeWorkItemsWithRecurrenceInstances(
    ctx.workspace.id,
    itemsResult.items,
    spaceRules,
    subMonths(now, 2),
    addMonths(now, 6),
    now
  )
  const quietDetails = computeQuietEntityDetails(
    entitiesAll,
    itemsResult.items,
    core.fields,
    recurrenceRules,
    now
  )
  const quietEntityWeeks = Object.fromEntries(
    quietDetails.map((q) => [q.entityId, q.weeksQuiet])
  )
  return {
    ...ctx,
    ...core,
    currentSpace: space,
    entities,
    recurrenceRules: spaceRules,
    items: displayItems,
    calendarConnection,
    childSpaces,
    quietEntityWeeks,
  }
}

export async function loadOverviewPageData() {
  const ctx = await getCurrentWorkspace()
  const client = await createClient()
  const core = await loadWorkspaceCore(client, ctx.workspace.id)
  const [itemsResult, recurrenceRules] = await Promise.all([
    listItems(client, ctx.workspace.id, { limit: 500 }),
    listRecurrenceRules(client, ctx.workspace.id),
  ])
  const now = new Date()
  const displayItems = mergeWorkItemsWithRecurrenceInstances(
    ctx.workspace.id,
    itemsResult.items,
    recurrenceRules.filter((r) => r.active),
    subMonths(now, 2),
    addMonths(now, 6),
    now
  )
  return {
    ...ctx,
    ...core,
    items: displayItems,
    recurrenceRules,
  }
}

/** @deprecated use loadSpacePageData / loadOverviewPageData */
export async function loadWorkspacePageData() {
  const shell = await loadWorkspaceShellData()
  const client = await createClient()
  const itemsResult = await listItems(client, shell.workspace.id)
  return {
    ...shell,
    items: itemsResult.items,
  }
}
