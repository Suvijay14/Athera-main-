'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { checkPlanLimit } from '@/lib/billing/limits'
import {
  countNonArchivedSpaces,
  countOpenWorkItems,
  getWorkspaceBilling,
} from '@/lib/billing/workspace-billing'
import { buildWorkItemsCsv, buildWorkspaceJsonExport } from '@/lib/export/workspace-export'
import { listFields } from '@/lib/db/fields'
import { listItems } from '@/lib/db/items'
import { mapEntityRow, mapFieldDefinitionRow, mapSpaceRow, mapViewDefinitionRow, mapWorkItemRow } from '@/lib/db/mappers'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/supabase/get-current-workspace'

export type PlanBlockedResult = {
  ok: false
  code: 'upgrade_required'
  message: string
  limit: 'spaces' | 'open_items'
}

export async function assertCanCreateSpace(): Promise<PlanBlockedResult | { ok: true }> {
  const { workspace } = await getCurrentWorkspace()
  const client = await createClient()
  const billing = await getWorkspaceBilling(client, workspace.id)
  const spaceCount = await countNonArchivedSpaces(client, workspace.id)
  const openItems = await countOpenWorkItems(client, workspace.id)
  const result = checkPlanLimit(
    {
      plan: billing?.plan ?? 'free',
      subscriptionStatus: billing?.subscriptionStatus ?? 'active',
      nonArchivedSpaceCount: spaceCount,
      openItemCount: openItems,
    },
    'create_space'
  )
  if (!result.allowed) {
    return { ok: false, code: result.code, message: result.message, limit: result.limit }
  }
  return { ok: true }
}

export async function assertCanCreateItem(): Promise<PlanBlockedResult | { ok: true }> {
  const { workspace } = await getCurrentWorkspace()
  const client = await createClient()
  const billing = await getWorkspaceBilling(client, workspace.id)
  const spaceCount = await countNonArchivedSpaces(client, workspace.id)
  const openItems = await countOpenWorkItems(client, workspace.id)
  const result = checkPlanLimit(
    {
      plan: billing?.plan ?? 'free',
      subscriptionStatus: billing?.subscriptionStatus ?? 'active',
      nonArchivedSpaceCount: spaceCount,
      openItemCount: openItems,
    },
    'create_item'
  )
  if (!result.allowed) {
    return { ok: false, code: result.code, message: result.message, limit: result.limit }
  }
  return { ok: true }
}

export async function exportWorkspaceCsvAction(): Promise<{ csv: string; filename: string }> {
  const { workspace } = await getCurrentWorkspace()
  const client = await createClient()
  const [fields, itemsResult] = await Promise.all([
    listFields(client, workspace.id),
    listItems(client, workspace.id, { limit: 500 }),
  ])
  const rows = itemsResult.items.map((item) => ({
    id: item.id,
    spaceId: item.spaceId,
    title: item.title,
    dueDate: item.dueDate,
    notes: item.notes,
    startAt: item.startAt,
    endAt: item.endAt,
    allDay: item.allDay,
    source: item.source,
    archivedAt: item.archivedAt,
    completedAt: item.completedAt,
    data: item.data,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }))
  const csv = buildWorkItemsCsv(rows, fields)
  return { csv, filename: `athera-items-${workspace.id.slice(0, 8)}.csv` }
}

export async function exportWorkspaceJsonAction(): Promise<{ json: string; filename: string }> {
  const { workspace } = await getCurrentWorkspace()
  const client = await createClient()

  const [
    spacesRes,
    itemsRes,
    fieldsRes,
    entitiesRes,
    viewsRes,
    rulesRes,
    pagesRes,
    draftsRes,
  ] = await Promise.all([
    client.from('spaces').select('*').eq('workspace_id', workspace.id),
    client.from('work_items').select('*').eq('workspace_id', workspace.id),
    client.from('field_definitions').select('*').eq('workspace_id', workspace.id),
    client.from('entities').select('*').eq('workspace_id', workspace.id),
    client.from('view_definitions').select('*').eq('workspace_id', workspace.id),
    client.from('recurrence_rules').select('*').eq('workspace_id', workspace.id),
    client.from('pages').select('*').eq('workspace_id', workspace.id),
    client.from('drafts').select('*').eq('workspace_id', workspace.id),
  ])

  const json = buildWorkspaceJsonExport({
    workspaceId: workspace.id,
    spaces: (spacesRes.data ?? []).map(mapSpaceRow),
    workItems: (itemsRes.data ?? []).map(mapWorkItemRow),
    fieldDefinitions: (fieldsRes.data ?? []).map(mapFieldDefinitionRow),
    entities: (entitiesRes.data ?? []).map(mapEntityRow),
    viewDefinitions: (viewsRes.data ?? []).map(mapViewDefinitionRow),
    recurrenceRules: (rulesRes.data ?? []).map((r) => r),
    pages: pagesRes.data ?? [],
    drafts: draftsRes.data ?? [],
  })

  return { json, filename: `athera-export-${workspace.id.slice(0, 8)}.json` }
}

const deleteConfirmSchema = z.object({
  confirmation: z.literal('DELETE'),
})

export async function requestAccountDeletionAction(
  raw: z.infer<typeof deleteConfirmSchema>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = deleteConfirmSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: 'Type DELETE to confirm account deletion.' }
  }

  const { workspace } = await getCurrentWorkspace()
  const client = await createClient()
  const deletedAt = new Date().toISOString()
  const { error } = await client
    .from('workspaces')
    .update({ deleted_at: deletedAt })
    .eq('id', workspace.id)

  if (error) {
    return { ok: false, error: error.message }
  }

  await client.auth.signOut()
  revalidatePath('/workspace', 'layout')
  redirect('/login?deleted=scheduled')
}
