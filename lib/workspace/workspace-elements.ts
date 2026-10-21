import type { JSONContent } from '@tiptap/core'
import { randomUUID } from 'node:crypto'

import type { DbClient } from '@/lib/db/db-client'
import { createItem } from '@/lib/db/items'
import { getOrCreatePage, savePageContent, type PageOwnerType } from '@/lib/db/pages'
import { createSpace, getDefaultSpaceId } from '@/lib/db/spaces'
import { wrapSupabaseError } from '@/lib/db/errors'
import { toJson } from '@/lib/db/json'
import type { Space, WorkItem } from '@/lib/db/schemas'

/** Five workspace element types from product spec. */
export type WorkspaceElementType = 'note' | 'reminder' | 'list' | 'checklist' | 'database'

export type WorkspaceElementStorage = {
  type: WorkspaceElementType
  /** Where the element lives in Postgres. */
  storage: 'pages' | 'work_items' | 'workspace_lists' | 'spaces'
  /** Already existed before brain-dump onboarding work. */
  preExisting: boolean
}

/** Which primitives exist today and where they are stored. */
export const WORKSPACE_ELEMENT_REGISTRY: WorkspaceElementStorage[] = [
  { type: 'note', storage: 'pages', preExisting: true },
  { type: 'reminder', storage: 'work_items', preExisting: false },
  { type: 'list', storage: 'workspace_lists', preExisting: false },
  { type: 'checklist', storage: 'pages', preExisting: true },
  { type: 'database', storage: 'spaces', preExisting: true },
]

export type WorkspaceList = {
  id: string
  workspaceId: string
  spaceId: string
  name: string
  createdAt: string
}

function textDoc(bodyText: string): JSONContent {
  return {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: bodyText }] }],
  }
}

function checklistDoc(lines: string[]): JSONContent {
  return {
    type: 'doc',
    content: [
      {
        type: 'taskList',
        content: lines.map((line) => ({
          type: 'taskItem',
          attrs: { checked: false, checkboxId: randomUUID() },
          content: [{ type: 'paragraph', content: [{ type: 'text', text: line }] }],
        })),
      },
    ],
  }
}

export async function createQuickNotePage(
  client: DbClient,
  workspaceId: string,
  bodyText: string
): Promise<{ pageId: string; ownerId: string }> {
  const ownerId = randomUUID()
  const doc = textDoc(bodyText)
  const { data, error } = await client
    .from('pages')
    .insert({
      workspace_id: workspaceId,
      owner_type: 'doc' satisfies PageOwnerType,
      owner_id: ownerId,
      body: toJson(doc),
      body_text: bodyText,
      page_kind: 'quick_note',
    })
    .select('id, owner_id')
    .single()

  if (error) {
    throw wrapSupabaseError('Failed to create quick note', error)
  }
  return { pageId: data.id as string, ownerId: data.owner_id as string }
}

export async function createWorkspaceReminder(
  client: DbClient,
  workspaceId: string,
  input: { title: string; spaceId?: string; dueDate?: string | null; startAt?: string | null }
): Promise<WorkItem> {
  return createItem(client, workspaceId, {
    title: input.title,
    spaceId: input.spaceId,
    dueDate: input.dueDate ?? null,
    startAt: input.startAt ?? null,
    data: {},
    elementKind: 'reminder',
  })
}

export async function createWorkspaceList(
  client: DbClient,
  workspaceId: string,
  input: { name: string; spaceId?: string; itemIds?: string[] }
): Promise<WorkspaceList> {
  const spaceId = input.spaceId ?? (await getDefaultSpaceId(client, workspaceId))
  const { data, error } = await client
    .from('workspace_lists')
    .insert({
      workspace_id: workspaceId,
      space_id: spaceId,
      name: input.name,
    })
    .select('*')
    .single()

  if (error) {
    throw wrapSupabaseError('Failed to create list', error)
  }

  const listId = data.id as string
  if (input.itemIds && input.itemIds.length > 0) {
    const rows = input.itemIds.map((workItemId, index) => ({
      list_id: listId,
      work_item_id: workItemId,
      sort_order: index,
    }))
    const { error: linkError } = await client.from('workspace_list_items').insert(rows)
    if (linkError) {
      throw wrapSupabaseError('Failed to link list items', linkError)
    }
  }

  return {
    id: listId,
    workspaceId: data.workspace_id as string,
    spaceId: data.space_id as string,
    name: data.name as string,
    createdAt: data.created_at as string,
  }
}

export async function createWorkspaceChecklist(
  client: DbClient,
  workspaceId: string,
  spaceId: string,
  lines: string[]
): Promise<{ pageId: string }> {
  const page = await getOrCreatePage(client, workspaceId, 'space', spaceId)
  const doc = checklistDoc(lines)
  const bodyText = lines.join('\n')
  await client.from('pages').update({ page_kind: 'checklist' }).eq('id', page.id)
  const saved = await savePageContent(client, workspaceId, page.id, doc, bodyText)
  return { pageId: saved.id }
}

export async function createWorkspaceDatabase(
  client: DbClient,
  workspaceId: string,
  name: string
): Promise<Space> {
  return createSpace(client, workspaceId, { name, sortOrder: 0 })
}

export async function createBrainDumpNote(
  client: DbClient,
  workspaceId: string,
  input: { title: string; spaceId: string }
): Promise<WorkItem> {
  return createItem(client, workspaceId, {
    title: input.title,
    spaceId: input.spaceId,
    data: {},
    elementKind: 'note',
  })
}

export async function createBrainDumpTask(
  client: DbClient,
  workspaceId: string,
  input: {
    title: string
    spaceId: string
    dueDate?: string | null
  }
): Promise<WorkItem> {
  return createItem(client, workspaceId, {
    title: input.title,
    spaceId: input.spaceId,
    dueDate: input.dueDate ?? null,
    data: {},
    elementKind: 'task',
  })
}

export async function createBrainDumpCalendarEvent(
  client: DbClient,
  workspaceId: string,
  input: {
    title: string
    spaceId: string
    startAt: string
    endAt: string | null
  }
): Promise<WorkItem> {
  return createItem(client, workspaceId, {
    title: input.title,
    spaceId: input.spaceId,
    startAt: input.startAt,
    endAt: input.endAt,
    allDay: false,
    data: {},
    elementKind: 'event',
  })
}
