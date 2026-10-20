import 'server-only'

import { subDays } from 'date-fns'

import { listEntities, createEntity } from '@/lib/db/entities'
import { listFields } from '@/lib/db/fields'
import { getItemById, updateItem } from '@/lib/db/items'
import type { DbClient } from '@/lib/db/db-client'
import {
  replaceExtractionsForItem,
  listExtractionsForWorkspaceSince,
} from '@/lib/db/item-entity-extractions.server'
import { extractEntitiesFromTitle } from '@/lib/llm/extract-entities'
import { LlmExtractionError } from '@/lib/llm/errors'
import { normalizeEntityKey } from '@/lib/adaptation/detector-utils'
import { ENTITY_FIELD_COLORS } from '@/lib/adaptation/entity-colors'

import type { AutoUnarchiveResult } from './auto-unarchive-entity'
import { scheduleAdaptation } from './schedule-adaptation'

export type EntityExtractionRunResult = {
  autoUnarchive: AutoUnarchiveResult | null
}

const AUTO_LINK_CONFIDENCE = 0.85

function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0]?.toLowerCase() ?? ''
}

function isFirstNameUniqueAmongKind(
  name: string,
  kind: string,
  entities: { name: string; kind: string }[]
): boolean {
  const fn = firstNameOf(name)
  if (!fn) {
    return false
  }
  const sameKind = entities.filter((e) => e.kind.toLowerCase() === kind.toLowerCase())
  const matches = sameKind.filter((e) => firstNameOf(e.name) === fn)
  return matches.length === 1 && normalizeEntityKey(matches[0]!.name) === normalizeEntityKey(name)
}

async function maybeSilentCreateEntity(
  client: DbClient,
  workspaceId: string,
  spaceId: string,
  kind: string,
  name: string
): Promise<string | null> {
  const since = subDays(new Date(), 21).toISOString()
  const extractions = await listExtractionsForWorkspaceSince(client, workspaceId, since)
  const norm = normalizeEntityKey(name)
  const count = extractions.filter(
    (e) =>
      e.spaceId === spaceId &&
      e.kind.toLowerCase() === kind.toLowerCase() &&
      normalizeEntityKey(e.name) === norm
  ).length
  if (count < 2) {
    return null
  }

  const existing = await listEntities(client, workspaceId, spaceId)
  const found = existing.find(
    (e) => e.kind.toLowerCase() === kind.toLowerCase() && normalizeEntityKey(e.name) === norm
  )
  if (found) {
    return found.id
  }

  const created = await createEntity(client, workspaceId, {
    spaceId,
    kind,
    name: name.trim(),
    aliases: [],
    color: ENTITY_FIELD_COLORS[existing.length % ENTITY_FIELD_COLORS.length] ?? '#6366f1',
  })
  return created.id
}

async function resolveEntityIdForAutoLink(
  client: DbClient,
  workspaceId: string,
  spaceId: string,
  kind: string,
  name: string,
  matchesExistingId: string | null,
  confidence: number,
  entities: Awaited<ReturnType<typeof listEntities>>
): Promise<string | null> {
  if (matchesExistingId) {
    if (confidence >= AUTO_LINK_CONFIDENCE) {
      return matchesExistingId
    }
    if (isFirstNameUniqueAmongKind(name, kind, entities)) {
      return matchesExistingId
    }
    return null
  }
  return maybeSilentCreateEntity(client, workspaceId, spaceId, kind, name)
}

export async function runEntityExtractionForItem(
  client: DbClient,
  workspaceId: string,
  workItemId: string
): Promise<EntityExtractionRunResult> {
  let item
  try {
    item = await getItemById(client, workspaceId, workItemId)
  } catch {
    return { autoUnarchive: null }
  }
  if (!item) {
    return { autoUnarchive: null }
  }

  let autoUnarchive: AutoUnarchiveResult | null = null

  const entities = await listEntities(client, workspaceId, item.spaceId)
  const existingForPrompt = entities.map((e) => ({
    id: e.id,
    name: e.name,
    kind: e.kind,
    aliases: e.aliases,
  }))

  let extracted
  try {
    extracted = await extractEntitiesFromTitle(item.title, existingForPrompt)
  } catch (err) {
    if (err instanceof LlmExtractionError) {
      console.warn('entity extraction skipped', { workItemId, code: err.code, message: err.message })
      return { autoUnarchive: null }
    }
    throw err
  }

  await replaceExtractionsForItem(client, workspaceId, workItemId, item.spaceId, extracted)

  const fields = await listFields(client, workspaceId)
  const entityFields = fields.filter((f) => f.type === 'entity' && f.visible)

  if (entityFields.length === 0) {
    scheduleAdaptation(client, workspaceId)
    return { autoUnarchive: null }
  }

  const primary = extracted[0]
  if (!primary) {
    scheduleAdaptation(client, workspaceId)
    return { autoUnarchive: null }
  }

  const field = entityFields.find(
    (f) => f.entityKind?.toLowerCase() === primary.kind.toLowerCase()
  )
  if (!field) {
    scheduleAdaptation(client, workspaceId)
    return { autoUnarchive: null }
  }

  const current = item.data[field.key]
  if (current !== undefined && current !== null && current !== '') {
    scheduleAdaptation(client, workspaceId)
    return { autoUnarchive: null }
  }

  const entityId = await resolveEntityIdForAutoLink(
    client,
    workspaceId,
    item.spaceId,
    primary.kind,
    primary.name,
    primary.matches_existing_id,
    primary.confidence,
    entities
  )

  if (entityId) {
    await updateItem(client, workspaceId, workItemId, {
      data: { ...item.data, [field.key]: entityId },
    })
    const { autoUnarchiveEntityIfArchived } = await import(
      '@/lib/adaptation/auto-unarchive-entity'
    )
    autoUnarchive = await autoUnarchiveEntityIfArchived(client, workspaceId, entityId)
  }

  scheduleAdaptation(client, workspaceId)
  return { autoUnarchive }
}
