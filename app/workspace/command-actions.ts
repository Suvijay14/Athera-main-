'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { applySuggestion } from '@/lib/adaptation/apply'
import type { SuggestionDraft } from '@/lib/adaptation/detector-types'
import { listEntities } from '@/lib/db/entities'
import { listFields } from '@/lib/db/fields'
import { getLatestChangeLogForSuggestion } from '@/lib/db/change-log'
import { insertPendingSuggestion } from '@/lib/db/suggestions'
import { listViews } from '@/lib/db/views'
import { getSpaceById } from '@/lib/db/spaces'
import { track } from '@/lib/events'
import {
  parseViewRequestFromText,
  viewRequestPromptContext,
} from '@/lib/llm/parse-view-request'
import {
  applyCreateViewSuggestionViaSupabase,
  isPgConnectionError,
} from '@/lib/workspace/apply-command-view-via-supabase'
import { resolveViewRequest } from '@/lib/workspace/resolve-view-request'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/supabase/get-current-workspace'

const inputSchema = z.object({
  spaceId: z.string().uuid(),
  text: z.string().trim().min(1),
})

export type CommandViewRequestResult =
  | { ok: true; action: 'switch'; viewId: string; spaceId: string }
  | { ok: true; action: 'create'; viewId: string; spaceId: string; summary: string }
  | { ok: true; action: 'unsupported'; message: string }
  | { ok: false; message: string }

function revalidateWorkspace() {
  revalidatePath('/workspace')
  revalidatePath('/workspace/spaces/[spaceId]', 'page')
  revalidatePath('/workspace/spaces/[spaceId]/[viewId]', 'page')
}

export async function runCommandViewRequestAction(
  raw: z.infer<typeof inputSchema>
): Promise<CommandViewRequestResult> {
  const { spaceId, text } = inputSchema.parse(raw)
  const { workspace, user } = await getCurrentWorkspace()
  const client = await createClient()

  const space = await getSpaceById(client, workspace.id, spaceId)
  if (!space) {
    return { ok: false, message: 'Space not found.' }
  }

  const [fields, views, entities] = await Promise.all([
    listFields(client, workspace.id),
    listViews(client, workspace.id),
    listEntities(client, workspace.id, spaceId),
  ])

  let spec
  try {
    spec = await parseViewRequestFromText(
      text,
      viewRequestPromptContext(spaceId, space.name, fields, entities)
    )
  } catch {
    try {
      await track(client, {
        workspaceId: workspace.id,
        userId: user.id,
        name: 'command_unsupported',
        props: { text },
      })
    } catch (trackErr) {
      console.error('command_unsupported event failed', trackErr)
    }
    return {
      ok: true,
      action: 'unsupported',
      message:
        "I can't do that yet. I can show your items as a list or calendar, grouped or filtered by anything.",
    }
  }

  const resolved = resolveViewRequest(spec, views.filter((v) => v.visible), fields)

  if (resolved.action === 'unsupported') {
    try {
      await track(client, {
        workspaceId: workspace.id,
        userId: user.id,
        name: 'command_unsupported',
        props: { text },
      })
    } catch (trackErr) {
      console.error('command_unsupported event failed', trackErr)
    }
    return {
      ok: true,
      action: 'unsupported',
      message:
        resolved.message ??
        "I can't do that yet. I can show your items as a list or calendar, grouped or filtered by anything.",
    }
  }

  const resultingViewType =
    resolved.action === 'switch'
      ? views.find((v) => v.id === resolved.viewId)?.type ?? null
      : resolved.view.view.type

  try {
    await track(client, {
      workspaceId: workspace.id,
      userId: user.id,
      name: 'command_request',
      props: {
        parsed: !('unsupported' in spec),
        resultingViewType,
      },
    })
  } catch (error) {
    console.error('command_request event failed', error)
  }

  if (resolved.action === 'switch') {
    return {
      ok: true,
      action: 'switch',
      viewId: resolved.viewId,
      spaceId,
    }
  }

  const draft: SuggestionDraft = {
    type: 'command-view-request',
    reason: resolved.suggestionReason,
    evidence: { commandText: text, spaceId },
    confidence: 1,
    dedupeKey: `command-view:${spaceId}:${Date.now()}`,
    operations: [resolved.view],
  }

  const inserted = await insertPendingSuggestion(client, workspace.id, draft)
  if (!inserted) {
    return { ok: false, message: 'Could not create view. Try again.' }
  }

  let createdViewId: string | null = null
  try {
    await applySuggestion(client, workspace.id, inserted.id, user.id)
    const viewsAfter = await listViews(client, workspace.id)
    createdViewId =
      viewsAfter.find(
        (v) => v.name === resolved.view.view.name && v.type === resolved.view.view.type
      )?.id ?? null
  } catch (error) {
    console.error('command-view-request apply failed', error)
    if (isPgConnectionError(error)) {
      try {
        createdViewId = await applyCreateViewSuggestionViaSupabase(
          client,
          workspace.id,
          inserted.id,
          resolved.view
        )
      } catch (fallbackErr) {
        console.error('command-view-request supabase fallback failed', fallbackErr)
        return {
          ok: false,
          message:
            'Could not save the view. Check Supabase connectivity, or set SUPABASE_DB_URL to the direct Database URI and restart the dev server.',
        }
      }
    } else {
      return { ok: false, message: 'Could not save the view. Try again or refresh the page.' }
    }
  }

  if (!createdViewId) {
    return { ok: false, message: 'View was applied but could not be loaded.' }
  }

  try {
    await track(client, {
      workspaceId: workspace.id,
      userId: user.id,
      name: 'suggestion_accepted',
      props: { suggestion_id: inserted.id, suggestion_type: draft.type },
    })
  } catch (error) {
    console.error('suggestion_accepted event failed', error)
  }

  await getLatestChangeLogForSuggestion(client, workspace.id, inserted.id)
  revalidateWorkspace()

  return {
    ok: true,
    action: 'create',
    viewId: createdViewId,
    spaceId,
    summary: resolved.suggestionReason,
  }
}
