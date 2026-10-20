'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { applySuggestionWithOperations } from '@/lib/adaptation/apply'
import { previewFromLoadedSuggestion } from '@/lib/adaptation/preview'
import {
  parseSplitSuggestionOperations,
  rebuildSplitSpaceOperations,
} from '@/lib/adaptation/split-space/rebuild-split-operations'
import type { Operation } from '@/lib/adaptation/types'
import { listFields } from '@/lib/db/fields'
import { listEntitiesForWorkspace } from '@/lib/db/entities'
import { getItemsByIds } from '@/lib/db/items'
import { getSuggestion } from '@/lib/db/suggestions'
import { SuggestionStateError } from '@/lib/adaptation/errors'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/supabase/get-current-workspace'

const acceptSplitSchema = z.object({
  suggestionId: z.string().uuid(),
  itemSpaceAssignments: z
    .array(
      z.object({
        itemId: z.string().uuid(),
        spaceId: z.string().uuid(),
      })
    )
    .min(1),
})

export type SplitSuggestionActionResult =
  | { ok: true; changeLogId: string; summary: string }
  | { ok: false; message: string }

function revalidateWorkspacePaths() {
  revalidatePath('/workspace')
  revalidatePath('/')
  revalidatePath('/workspace/overview')
}

export async function acceptSplitSpaceSuggestionAction(
  raw: z.infer<typeof acceptSplitSchema>
): Promise<SplitSuggestionActionResult> {
  const { suggestionId, itemSpaceAssignments } = acceptSplitSchema.parse(raw)
  try {
    const { workspace, user } = await getCurrentWorkspace()
    const client = await createClient()
    const suggestion = await getSuggestion(client, workspace.id, suggestionId)
    if (!suggestion) {
      return { ok: false, message: 'Suggestion not found.' }
    }
    if (suggestion.type !== 'split_space') {
      return { ok: false, message: 'Not a split-space suggestion.' }
    }

    const sourceSpaceId =
      typeof suggestion.evidence.sourceSpaceId === 'string'
        ? suggestion.evidence.sourceSpaceId
        : null
    if (!sourceSpaceId) {
      return { ok: false, message: 'Split suggestion is missing source space.' }
    }

    const { clusters, itemIds, initialAssignments } = parseSplitSuggestionOperations(
      suggestion.operations as Operation[]
    )
    const allowedSpaceIds = new Set(clusters.map((c) => c.spaceId))
    if (allowedSpaceIds.size === 0) {
      return { ok: false, message: 'Split suggestion has no target spaces.' }
    }

    const assignmentMap = new Map<string, string>(initialAssignments)
    for (const row of itemSpaceAssignments) {
      if (!allowedSpaceIds.has(row.spaceId)) {
        return { ok: false, message: 'Invalid target space for an item.' }
      }
      assignmentMap.set(row.itemId, row.spaceId)
    }

    for (const id of itemIds) {
      if (!assignmentMap.has(id)) {
        return { ok: false, message: 'Every split item must have a target space.' }
      }
    }

    const [fields, entities, items] = await Promise.all([
      listFields(client, workspace.id),
      listEntitiesForWorkspace(client, workspace.id),
      getItemsByIds(client, workspace.id, itemIds),
    ])

    const operations = rebuildSplitSpaceOperations({
      clusters,
      sourceSpaceId,
      itemAssignments: assignmentMap,
      entities,
      fields,
      items,
    })

    const preview = await previewFromLoadedSuggestion(client, workspace.id, suggestion)
    const { changeLogId } = await applySuggestionWithOperations(
      client,
      workspace.id,
      suggestionId,
      user.id,
      operations
    )
    revalidateWorkspacePaths()
    return { ok: true, changeLogId, summary: preview.summary }
  } catch (error) {
    console.error('acceptSplitSpaceSuggestionAction failed', error)
    const message =
      error instanceof SuggestionStateError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Could not apply split.'
    return { ok: false, message }
  }
}
