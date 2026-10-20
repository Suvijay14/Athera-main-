import type { JSONContent } from '@tiptap/core'

import type { DbClient } from './db-client'
import { DbError, wrapSupabaseError } from './errors'
import { toJson } from './json'

export type PageOwnerType = 'space' | 'entity' | 'doc'

export type Page = {
  id: string
  workspaceId: string
  ownerType: PageOwnerType
  ownerId: string
  body: JSONContent
  bodyText: string
  createdAt: string
  updatedAt: string
}

/** Default TipTap document for a new notes page (no DB row yet). */
export function emptyNotesDocument(): JSONContent {
  return { type: 'doc', content: [{ type: 'paragraph' }] }
}

export function emptyPageForOwner(
  workspaceId: string,
  ownerType: PageOwnerType,
  ownerId: string
): Page {
  return {
    id: '',
    workspaceId,
    ownerType,
    ownerId,
    body: emptyNotesDocument(),
    bodyText: '',
    createdAt: '',
    updatedAt: '',
  }
}

/** PostgREST: no row / missing table — treat as "no notes yet", not an error. */
function isBenignPageLoadError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false
  }
  const code = (error as { code?: string }).code
  const message = String((error as { message?: string }).message ?? '')
  return (
    code === 'PGRST116' ||
    code === 'PGRST205' ||
    code === '42P01' ||
    (message.includes('pages') &&
      (message.includes('does not exist') || message.includes('Could not find')))
  )
}

function mapPageRow(row: Record<string, unknown>): Page {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    ownerType: row.owner_type as PageOwnerType,
    ownerId: row.owner_id as string,
    body: (row.body ?? {}) as JSONContent,
    bodyText: (row.body_text as string) ?? '',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export async function getPageByOwner(
  client: DbClient,
  workspaceId: string,
  ownerType: PageOwnerType,
  ownerId: string
): Promise<Page | null> {
  const { data, error } = await client
    .from('pages')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('owner_type', ownerType)
    .eq('owner_id', ownerId)
    .maybeSingle()

  if (error) {
    if (isBenignPageLoadError(error)) {
      return null
    }
    throw wrapSupabaseError('Failed to load page', error)
  }
  return data ? mapPageRow(data as Record<string, unknown>) : null
}

/**
 * Load notes for UI: never throws for missing row or missing migration — empty editor instead.
 */
export async function getPageForOwnerOrEmpty(
  client: DbClient,
  workspaceId: string,
  ownerType: PageOwnerType,
  ownerId: string
): Promise<Page> {
  try {
    const page = await getPageByOwner(client, workspaceId, ownerType, ownerId)
    return page ?? emptyPageForOwner(workspaceId, ownerType, ownerId)
  } catch (err) {
    if (err instanceof DbError && err.code === 'not_found') {
      return emptyPageForOwner(workspaceId, ownerType, ownerId)
    }
    throw err
  }
}

export async function getOrCreatePage(
  client: DbClient,
  workspaceId: string,
  ownerType: PageOwnerType,
  ownerId: string
): Promise<Page> {
  const existing = await getPageByOwner(client, workspaceId, ownerType, ownerId)
  if (existing) {
    return existing
  }
  const emptyDoc = emptyNotesDocument()
  const { data, error } = await client
    .from('pages')
    .insert({
      workspace_id: workspaceId,
      owner_type: ownerType,
      owner_id: ownerId,
      body: toJson(emptyDoc),
      body_text: '',
    })
    .select('*')
    .single()

  if (error) {
    if (isBenignPageLoadError(error)) {
      return emptyPageForOwner(workspaceId, ownerType, ownerId)
    }
    const pgCode =
      typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code: string }).code)
        : ''
    if (pgCode === '23505') {
      const raced = await getPageByOwner(client, workspaceId, ownerType, ownerId)
      if (raced) {
        return raced
      }
    }
    throw wrapSupabaseError('Failed to create page', error)
  }
  return mapPageRow(data as Record<string, unknown>)
}

export async function savePageContent(
  client: DbClient,
  workspaceId: string,
  pageId: string,
  body: JSONContent,
  bodyText: string
): Promise<Page> {
  const now = new Date().toISOString()
  const { data, error } = await client
    .from('pages')
    .update({
      body: toJson(body),
      body_text: bodyText,
      updated_at: now,
    })
    .eq('workspace_id', workspaceId)
    .eq('id', pageId)
    .select('*')
    .single()

  if (error) {
    throw wrapSupabaseError('Failed to save page', error)
  }

  const { error: versionError } = await client.from('page_versions').insert({
    page_id: pageId,
    body: toJson(body),
    body_text: bodyText,
  })
  if (versionError && !isBenignPageLoadError(versionError)) {
    throw wrapSupabaseError('Failed to save page version', versionError)
  }

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  await client.from('page_versions').delete().eq('page_id', pageId).lt('created_at', cutoff)

  return mapPageRow(data as Record<string, unknown>)
}

export async function listPagesForWorkspace(
  client: DbClient,
  workspaceId: string
): Promise<{ pageId: string; ownerType: PageOwnerType; ownerId: string; bodyText: string }[]> {
  const { data, error } = await client
    .from('pages')
    .select('id, owner_type, owner_id, body_text')
    .eq('workspace_id', workspaceId)

  if (error) {
    if (isBenignPageLoadError(error)) {
      return []
    }
    throw wrapSupabaseError('Failed to list pages', error)
  }
  return (data ?? []).map((row) => ({
    pageId: row.id as string,
    ownerType: row.owner_type as PageOwnerType,
    ownerId: row.owner_id as string,
    bodyText: (row.body_text as string) ?? '',
  }))
}

export async function searchPagesByText(
  client: DbClient,
  workspaceId: string,
  query: string,
  limit = 8
): Promise<{ pageId: string; ownerType: PageOwnerType; ownerId: string; snippet: string }[]> {
  const q = query.trim().toLowerCase()
  if (!q) {
    return []
  }
  const { data, error } = await client
    .from('pages')
    .select('id, owner_type, owner_id, body_text')
    .eq('workspace_id', workspaceId)
    .ilike('body_text', `%${q.replace(/%/g, '')}%`)
    .limit(limit)

  if (error) {
    if (isBenignPageLoadError(error)) {
      return []
    }
    throw wrapSupabaseError('Failed to search pages', error)
  }

  return (data ?? []).map((row) => {
    const text = (row.body_text as string) ?? ''
    const idx = text.toLowerCase().indexOf(q)
    const snippet =
      idx >= 0
        ? text.slice(Math.max(0, idx - 20), idx + q.length + 40).trim()
        : text.slice(0, 80)
    return {
      pageId: row.id as string,
      ownerType: row.owner_type as PageOwnerType,
      ownerId: row.owner_id as string,
      snippet,
    }
  })
}
