'use server'

import type { JSONContent } from '@tiptap/core'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { scheduleNoteEntityExtraction } from '@/lib/adaptation/schedule-note-entity-extraction'
import { listFields } from '@/lib/db/fields'
import { createItem, getItemById, updateItem } from '@/lib/db/items'
import { getOrCreatePage, savePageContent, type PageOwnerType } from '@/lib/db/pages'
import { track } from '@/lib/events'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/supabase/get-current-workspace'
import { entityFieldKeys } from '@/lib/workspace/entity-items'
import {
  extractCheckboxStatesFromDoc,
  patchCheckboxItemIdsInDoc,
} from '@/lib/workspace/notes/parse-note-document'
import { planCheckboxSyncActions } from '@/lib/workspace/notes/checkbox-sync'
import { checkboxLineToCreatePayload } from '@/lib/workspace/notes/checkbox-item-title'

const savePageSchema = z.object({
  ownerType: z.enum(['space', 'entity']),
  ownerId: z.string().uuid(),
  spaceId: z.string().uuid(),
  entityId: z.string().uuid().nullable(),
  body: z.record(z.string(), z.unknown()),
  bodyText: z.string(),
  previousCheckboxStates: z.array(
    z.object({
      checkboxId: z.string().min(1),
      text: z.string(),
      checked: z.boolean(),
      itemId: z.string().uuid().nullable(),
    })
  ),
})

export type SaveNotesPageResult = {
  pageId: string
  body: JSONContent
  checkboxesCreated: number
  savedAt: string
}

export async function saveNotesPageAction(
  input: z.infer<typeof savePageSchema>
): Promise<SaveNotesPageResult> {
  const parsed = savePageSchema.parse(input)
  const { workspace, user } = await getCurrentWorkspace()
  const client = await createClient()

  const page = await getOrCreatePage(
    client,
    workspace.id,
    parsed.ownerType as PageOwnerType,
    parsed.ownerId
  )

  let body = parsed.body as JSONContent
  const currentCheckboxes = extractCheckboxStatesFromDoc(body)
  const nowIso = new Date().toISOString()
  const actions = planCheckboxSyncActions(parsed.previousCheckboxStates, currentCheckboxes, nowIso)

  const links: { checkboxId: string; itemId: string }[] = []
  let checkboxesCreated = 0
  const fields = await listFields(client, workspace.id)
  const entityKeys = entityFieldKeys(fields)
  let entityFieldKey: string | null = null
  if (parsed.entityId) {
    entityFieldKey =
      fields.find((f) => f.type === 'entity' && entityKeys.includes(f.key))?.key ?? null
  }

  for (const action of actions) {
    if (action.kind === 'create') {
      const payload = checkboxLineToCreatePayload(action.text)
      if (!payload) {
        continue
      }
      const data: Record<string, unknown> = { ...payload.data }
      if (parsed.entityId && entityFieldKey) {
        data[entityFieldKey] = parsed.entityId
      }
      const item = await createItem(client, workspace.id, {
        title: payload.title,
        spaceId: parsed.spaceId,
        dueDate: payload.dueDate,
        startAt: payload.startAt,
        endAt: payload.endAt,
        allDay: payload.allDay,
        data,
        source: 'manual',
      })
      links.push({ checkboxId: action.checkboxId, itemId: item.id })
      checkboxesCreated++
      await track(client, {
        workspaceId: workspace.id,
        userId: user.id,
        name: 'item_created',
        props: {},
      })
    } else if (action.kind === 'completion') {
      await updateItem(client, workspace.id, action.itemId, {
        completedAt: action.completedAt,
      })
    }
  }

  if (links.length > 0) {
    body = patchCheckboxItemIdsInDoc(body, links)
  }

  const saved = await savePageContent(client, workspace.id, page.id, body, parsed.bodyText)

  if (checkboxesCreated > 0) {
    await track(client, {
      workspaceId: workspace.id,
      userId: user.id,
      name: 'notes_updated',
      props: {
        page_id: saved.id,
        owner_type: parsed.ownerType,
        owner_id: parsed.ownerId,
        checkboxes_created: checkboxesCreated,
      },
    })
  }

  scheduleNoteEntityExtraction(
    client,
    workspace.id,
    saved.id,
    parsed.spaceId,
    parsed.bodyText
  )

  revalidatePath('/workspace')
  revalidatePath(`/workspace/spaces/${parsed.spaceId}/notes`)
  if (parsed.entityId) {
    revalidatePath(`/workspace/spaces/${parsed.spaceId}/entities/${parsed.entityId}`)
  }

  return {
    pageId: saved.id,
    body: saved.body,
    checkboxesCreated,
    savedAt: saved.updatedAt,
  }
}

export async function loadNotesPageForOwnerAction(input: {
  ownerType: 'space' | 'entity'
  ownerId: string
  spaceId: string
}) {
  const { workspace } = await getCurrentWorkspace()
  const client = await createClient()
  const page = await getOrCreatePage(
    client,
    workspace.id,
    input.ownerType,
    input.ownerId
  )

  const checkboxes = extractCheckboxStatesFromDoc(page.body)
  const completionByItemId: Record<string, boolean> = {}
  for (const cb of checkboxes) {
    if (cb.itemId) {
      const item = await getItemById(client, workspace.id, cb.itemId)
      if (item) {
        completionByItemId[cb.itemId] = item.completedAt !== null
      }
    }
  }

  return {
    page,
    completionByItemId,
  }
}
