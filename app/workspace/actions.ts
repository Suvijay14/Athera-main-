'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createField, setFieldVisibility, updateFieldLabel } from '@/lib/db/fields'
import { createItem, deleteItem, getItemById, updateItem } from '@/lib/db/items'
import {
  createFieldInputSchema,
  createViewInputSchema,
  createWorkItemInputSchema,
  fieldKeySchema,
  updateWorkItemInputSchema,
  viewTypeSchema,
} from '@/lib/db/schemas'
import { createView, setViewVisibility, updateView } from '@/lib/db/views'
import { runEntityExtractionForItem } from '@/lib/adaptation/run-entity-extraction'
import { scheduleEntityExtraction } from '@/lib/adaptation/schedule-entity-extraction'
import type { WorkItem } from '@/lib/db/schemas'
import { track } from '@/lib/events'
import { logItemMovedSpace } from '@/lib/workspace/log-item-moved-space'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/supabase/get-current-workspace'

function revalidateWorkspace() {
  revalidatePath('/workspace')
  revalidatePath('/workspace/[viewId]', 'page')
}

export type WorkItemMutationResult = {
  item: WorkItem
  reactivatedEntityName?: string
  /** Present when spaceResolution was used on create. */
  spaceSort?: {
    method: 'hard-rule' | 'classified' | 'unsorted'
    unsorted: boolean
  }
}

export type CreateWorkItemActionResult =
  | ({ ok: true } & WorkItemMutationResult)
  | { ok: false; code: 'upgrade_required'; message: string; limit: 'spaces' | 'open_items' }

export async function createWorkItemAction(
  input: z.infer<typeof createWorkItemInputSchema>
): Promise<CreateWorkItemActionResult> {
  const parsed = createWorkItemInputSchema.parse(input)
  const { assertCanCreateItem } = await import('@/app/workspace/account-actions')
  const gate = await assertCanCreateItem()
  if (!gate.ok) {
    return { ok: false, code: gate.code, message: gate.message, limit: gate.limit }
  }
  const { workspace, user } = await getCurrentWorkspace()
  const client = await createClient()

  let createInput = parsed
  let spaceSort: WorkItemMutationResult['spaceSort']

  if (parsed.spaceResolution) {
    const { listFields } = await import('@/lib/db/fields')
    const { listItems } = await import('@/lib/db/items')
    const { listEntitiesForWorkspace } = await import('@/lib/db/entities')
    const { listSpaces } = await import('@/lib/db/spaces')
    const { resolveItemSpaceForCreate } = await import('@/lib/workspace/resolve-item-space')

    const [fields, itemsResult, entities, spaces] = await Promise.all([
      listFields(client, workspace.id),
      listItems(client, workspace.id, { limit: 500 }),
      listEntitiesForWorkspace(client, workspace.id),
      listSpaces(client, workspace.id),
    ])

    const resolved = await resolveItemSpaceForCreate(
      client,
      workspace.id,
      parsed.title,
      parsed.data,
      {
        contextSpaceId: parsed.spaceResolution.contextSpaceId ?? null,
        fromSpaceView: parsed.spaceResolution.fromSpaceView,
        source: parsed.source,
        recurrenceSpaceId: parsed.spaceId,
      },
      { fields, items: itemsResult.items, entities, spaces }
    )

    createInput = {
      ...parsed,
      spaceId: resolved.spaceId,
      spaceConfidence: resolved.confidence,
    }
    spaceSort = {
      method: resolved.method,
      unsorted: resolved.method === 'unsorted',
    }
  }

  const item = await createItem(client, workspace.id, createInput)
  await track(client, {
    workspaceId: workspace.id,
    userId: user.id,
    name: 'item_created',
    props: {},
  })
  revalidateWorkspace()
  const { autoUnarchive } = await runEntityExtractionForItem(client, workspace.id, item.id)
  const reactivatedEntityName =
    autoUnarchive?.unarchived && autoUnarchive.entityName
      ? autoUnarchive.entityName
      : undefined
  return { ok: true, item, reactivatedEntityName, spaceSort }
}

export async function updateWorkItemAction(
  itemId: string,
  patch: z.infer<typeof updateWorkItemInputSchema>
): Promise<WorkItemMutationResult> {
  const id = z.string().uuid().parse(itemId)
  const parsed = updateWorkItemInputSchema.parse(patch)
  const { workspace, user } = await getCurrentWorkspace()
  const client = await createClient()

  const before =
    parsed.spaceId !== undefined ? await getItemById(client, workspace.id, id) : null
  const patchWithConfidence =
    before && parsed.spaceId !== undefined && before.spaceId !== parsed.spaceId
      ? { ...parsed, spaceConfidence: parsed.spaceConfidence ?? 1 }
      : parsed
  const item = await updateItem(client, workspace.id, id, patchWithConfidence)
  if (before && parsed.spaceId !== undefined && before.spaceId !== parsed.spaceId) {
    await logItemMovedSpace(client, {
      workspaceId: workspace.id,
      userId: user.id,
      itemId: id,
      fromSpaceId: before.spaceId,
      toSpaceId: parsed.spaceId,
      title: before.title,
    })
  }
  let reactivatedEntityName: string | undefined
  if (parsed.data) {
    const { listFields } = await import('@/lib/db/fields')
    const { entityFieldKeys } = await import('@/lib/workspace/entity-items')
    const { autoUnarchiveEntityIfArchived } = await import('@/lib/adaptation/auto-unarchive-entity')
    const fields = await listFields(client, workspace.id)
    for (const key of entityFieldKeys(fields)) {
      const val = parsed.data[key]
      if (typeof val === 'string' && /^[0-9a-f-]{36}$/i.test(val)) {
        const result = await autoUnarchiveEntityIfArchived(client, workspace.id, val)
        if (result.unarchived && result.entityName) {
          reactivatedEntityName = result.entityName
        }
      }
    }
  }
  await track(client, {
    workspaceId: workspace.id,
    userId: user.id,
    name: 'item_edited',
    props: {},
  })
  revalidateWorkspace()
  scheduleEntityExtraction(client, workspace.id, item.id)
  return { item, reactivatedEntityName }
}

export async function deleteWorkItemAction(itemId: string) {
  const id = z.string().uuid().parse(itemId)
  const { workspace } = await getCurrentWorkspace()
  const client = await createClient()
  await deleteItem(client, workspace.id, id)
  revalidateWorkspace()
}

const quickCreatePayloadSchema = createWorkItemInputSchema.pick({
  title: true,
  dueDate: true,
  startAt: true,
  endAt: true,
  allDay: true,
  data: true,
  spaceResolution: true,
})

export async function quickCreateWorkItemAction(
  raw: string | z.infer<typeof quickCreatePayloadSchema>
) {
  if (typeof raw === 'string') {
    const trimmed = z.string().trim().min(1).parse(raw)
    return createWorkItemAction({
      title: trimmed,
      data: {},
      spaceResolution: { fromSpaceView: false, contextSpaceId: null },
    })
  }
  const parsed = quickCreatePayloadSchema.parse({ ...raw, data: raw.data ?? {} })
  return createWorkItemAction({
    ...parsed,
    spaceResolution: parsed.spaceResolution ?? {
      fromSpaceView: false,
      contextSpaceId: null,
    },
  })
}

export async function createFieldAction(input: z.infer<typeof createFieldInputSchema>) {
  const parsed = createFieldInputSchema.parse(input)
  const { workspace } = await getCurrentWorkspace()
  const client = await createClient()
  const field = await createField(client, workspace.id, parsed)
  revalidateWorkspace()
  return field
}

export async function setFieldVisibilityAction(key: string, visible: boolean) {
  const parsedKey = fieldKeySchema.parse(key)
  const { workspace } = await getCurrentWorkspace()
  const client = await createClient()
  await setFieldVisibility(client, workspace.id, parsedKey, visible)
  revalidateWorkspace()
}

export async function renameFieldAction(key: string, label: string) {
  const parsedKey = fieldKeySchema.parse(key)
  const parsedLabel = z.string().min(1).parse(label)
  const { workspace } = await getCurrentWorkspace()
  const client = await createClient()
  await updateFieldLabel(client, workspace.id, parsedKey, parsedLabel)
  revalidateWorkspace()
}

export async function createViewAction(input: z.infer<typeof createViewInputSchema>) {
  const parsed = createViewInputSchema.parse(input)
  const { workspace } = await getCurrentWorkspace()
  const client = await createClient()
  const view = await createView(client, workspace.id, parsed)
  revalidateWorkspace()
  return view
}

const updateViewSettingsSchema = z.object({
  viewId: z.string().uuid(),
  calendarRange: z.enum(['week', 'month']).optional(),
  colorByField: fieldKeySchema.nullable().optional(),
})

export async function updateViewSettingsAction(input: z.infer<typeof updateViewSettingsSchema>) {
  const parsed = updateViewSettingsSchema.parse(input)
  const { workspace } = await getCurrentWorkspace()
  const client = await createClient()
  await updateView(client, workspace.id, parsed.viewId, {
    calendarRange: parsed.calendarRange,
    colorByField: parsed.colorByField,
  })
  revalidateWorkspace()
}

export async function setViewVisibilityAction(viewId: string, visible: boolean) {
  const id = z.string().uuid().parse(viewId)
  const { workspace } = await getCurrentWorkspace()
  const client = await createClient()
  await setViewVisibility(client, workspace.id, id, visible)
  revalidateWorkspace()
}

export async function logViewOpenedAction(viewId: string, viewType: string) {
  const id = z.string().uuid().parse(viewId)
  const type = viewTypeSchema.parse(viewType)
  const { workspace, user } = await getCurrentWorkspace()
  const client = await createClient()
  await track(client, {
    workspaceId: workspace.id,
    userId: user.id,
    name: 'view_opened',
    props: { viewId: id, viewType: type },
  })
}
