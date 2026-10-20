'use server'

import { addDays, formatISO } from 'date-fns'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { applySuggestionWithOperations } from '@/lib/adaptation/apply'
import type { Operation } from '@/lib/adaptation/types'
import { draftCheckinMessage } from '@/lib/llm/draft-checkin'
import { listFields } from '@/lib/db/fields'
import { getEntityById, setEntityExcludedFromSuggestions } from '@/lib/db/entities'
import { listItems } from '@/lib/db/items'
import { getSuggestion } from '@/lib/db/suggestions'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/supabase/get-current-workspace'
import { entityFieldKeys, itemsLinkedToEntity } from '@/lib/workspace/entity-items'
import { pickItemRhythmDate } from '@/lib/adaptation/entity-rhythm'
import { format } from 'date-fns'

const archiveInputSchema = z.object({
  suggestionId: z.string().uuid(),
  entityIds: z.array(z.string().uuid()).min(1),
})

const followUpInputSchema = z.object({
  suggestionId: z.string().uuid(),
  entityIds: z.array(z.string().uuid()).min(1),
})

export type ArchiveActionResult =
  | {
      ok: true
      draft?: { body: string; entityName: string; channel: 'email' }
      changeLogId?: string
      toastSummary?: string
    }
  | { ok: false; message: string }

function revalidateWorkspacePaths() {
  revalidatePath('/workspace')
  revalidatePath('/workspace/spaces/[spaceId]', 'page')
}

function filterArchiveOps(operations: Operation[], entityIds: string[]): Operation[] {
  const set = new Set(entityIds)
  return operations.filter(
    (op): op is Operation & { op: 'archive_entity' } =>
      op.op === 'archive_entity' && set.has(op.entityId)
  )
}

export async function archiveSelectedEntitiesAction(
  raw: z.infer<typeof archiveInputSchema>
): Promise<ArchiveActionResult> {
  const { suggestionId, entityIds } = archiveInputSchema.parse(raw)
  try {
    const { workspace, user } = await getCurrentWorkspace()
    const client = await createClient()
    const suggestion = await getSuggestion(client, workspace.id, suggestionId)
    if (!suggestion) {
      return { ok: false, message: 'Suggestion not found.' }
    }
    const ops = filterArchiveOps(suggestion.operations as Operation[], entityIds)
    if (ops.length === 0) {
      return { ok: false, message: 'No archive actions selected.' }
    }
    const { changeLogId } = await applySuggestionWithOperations(
      client,
      workspace.id,
      suggestionId,
      user.id,
      ops
    )
    revalidateWorkspacePaths()
    return {
      ok: true,
      changeLogId,
      toastSummary: ops.length === 1 ? 'Contact archived' : `${ops.length} contacts archived`,
    }
  } catch (error) {
    console.error('archiveSelectedEntitiesAction', error)
    return { ok: false, message: error instanceof Error ? error.message : 'Archive failed.' }
  }
}

export async function followUpSelectedEntitiesAction(
  raw: z.infer<typeof followUpInputSchema>
): Promise<ArchiveActionResult> {
  const { suggestionId, entityIds } = followUpInputSchema.parse(raw)
  try {
    const { workspace, user } = await getCurrentWorkspace()
    const client = await createClient()
    const suggestion = await getSuggestion(client, workspace.id, suggestionId)
    if (!suggestion) {
      return { ok: false, message: 'Suggestion not found.' }
    }

    const fields = await listFields(client, workspace.id)
    const keys = entityFieldKeys(fields)
    const entityField = fields.find((f) => f.type === 'entity')
    if (!entityField) {
      return { ok: false, message: 'No entity field in this workspace.' }
    }

    const { items } = await listItems(client, workspace.id, { limit: 500 })
    const dueDate = formatISO(addDays(new Date(), 3), { representation: 'date' })
    const allOps: Operation[] = []
    let lastDraft: { body: string; entityName: string } | null = null

    for (const entityId of entityIds) {
      const entity = await getEntityById(client, workspace.id, entityId)
      if (!entity) {
        continue
      }
      const linked = itemsLinkedToEntity(items, entityId, keys).slice(0, 5)
      const recentItems = linked.map((item) => {
        const d = pickItemRhythmDate(item)
        return {
          title: item.title,
          dateLabel: d ? format(d, 'MMM d, yyyy') : 'No date',
        }
      })
      const body = await draftCheckinMessage({
        entityName: entity.name,
        entityKind: entity.kind,
        weeksSinceLastActivity: 3,
        cadenceLabel: entity.typicalGapDays ? `about every ${Math.round(entity.typicalGapDays)} days` : null,
        recentItems,
      })
      allOps.push({
        op: 'create_followup_item',
        entityId,
        spaceId: entity.spaceId,
        entityFieldKey: entityField.key,
        title: `Follow up with ${entity.name}`,
        dueDate,
      })
      allOps.push({
        op: 'create_draft',
        entityId,
        channel: 'email',
        body,
      })
      lastDraft = { body, entityName: entity.name }
    }

    if (allOps.length === 0) {
      return { ok: false, message: 'Could not build follow-up.' }
    }

    const { changeLogId } = await applySuggestionWithOperations(
      client,
      workspace.id,
      suggestionId,
      user.id,
      allOps
    )
    revalidateWorkspacePaths()

    return {
      ok: true,
      draft: lastDraft
        ? { body: lastDraft.body, entityName: lastDraft.entityName, channel: 'email' }
        : undefined,
      changeLogId,
      toastSummary: 'Follow-up reminder added',
    }
  } catch (error) {
    console.error('followUpSelectedEntitiesAction', error)
    return { ok: false, message: error instanceof Error ? error.message : 'Follow-up failed.' }
  }
}

export async function excludeEntityFromArchiveAction(
  entityId: string
): Promise<{ ok: boolean; message?: string }> {
  try {
    const { workspace } = await getCurrentWorkspace()
    const client = await createClient()
    await setEntityExcludedFromSuggestions(client, workspace.id, entityId, true)
    revalidateWorkspacePaths()
    return { ok: true }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Update failed.' }
  }
}
