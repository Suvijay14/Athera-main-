'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import {
  applySuggestion,
  dismissSuggestion,
  OperationError,
  SuggestionStateError,
  undoChange,
} from '@/lib/adaptation/apply'
import { previewFromLoadedSuggestion, previewSuggestion } from '@/lib/adaptation/preview'
import { getLatestChangeLogForSuggestion } from '@/lib/db/change-log'
import { getSuggestion, markSuggestionShown } from '@/lib/db/suggestions'
import { scheduleAdaptation } from '@/lib/adaptation/schedule-adaptation'
import { track } from '@/lib/events'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/supabase/get-current-workspace'

const idSchema = z.string().uuid()

export type SuggestionActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; message: string }

function revalidateWorkspacePaths() {
  revalidatePath('/workspace')
  revalidatePath('/workspace/overview')
  revalidatePath('/workspace/spaces/[spaceId]', 'page')
  revalidatePath('/workspace/spaces/[spaceId]/[viewId]', 'page')
  revalidatePath('/workspace/[viewId]', 'page')
  revalidatePath('/workspace/changes')
}

function toUserMessage(error: unknown): string {
  if (error instanceof SuggestionStateError || error instanceof OperationError) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Something went wrong. Try again.'
}

async function withAction<T>(
  fn: () => Promise<T>
): Promise<SuggestionActionResult<T>> {
  try {
    const data = await fn()
    return { ok: true, data }
  } catch (error) {
    console.error('Suggestion action failed', error)
    return { ok: false, message: toUserMessage(error) }
  }
}

export async function markShownAction(
  suggestionId: string
): Promise<SuggestionActionResult> {
  const id = idSchema.parse(suggestionId)
  return withAction(async () => {
    const { workspace, user } = await getCurrentWorkspace()
    const client = await createClient()
    await markSuggestionShown(client, workspace.id, id, user.id)
  })
}

export async function previewSuggestionAction(
  suggestionId: string
): Promise<SuggestionActionResult<Awaited<ReturnType<typeof previewSuggestion>>>> {
  const id = idSchema.parse(suggestionId)
  return withAction(async () => {
    const { workspace, user } = await getCurrentWorkspace()
    const client = await createClient()
    const preview = await previewSuggestion(client, workspace.id, id)
    try {
      const suggestion = await getSuggestion(client, workspace.id, id)
      if (suggestion) {
        await track(client, {
          workspaceId: workspace.id,
          userId: user.id,
          name: 'suggestion_previewed',
          props: { suggestion_id: id, suggestion_type: suggestion.type },
        })
      }
    } catch (trackError) {
      console.error('suggestion_previewed event failed', trackError)
    }
    return preview
  })
}

export async function acceptSuggestionAction(
  suggestionId: string
): Promise<SuggestionActionResult<{ changeLogId: string; summary: string }>> {
  const id = idSchema.parse(suggestionId)
  return withAction(async () => {
    const { workspace, user } = await getCurrentWorkspace()
    const client = await createClient()
    const suggestion = await getSuggestion(client, workspace.id, id)
    if (!suggestion) {
      throw new SuggestionStateError(`Suggestion "${id}" not found`)
    }
    const preview = await previewFromLoadedSuggestion(client, workspace.id, suggestion)
    await applySuggestion(client, workspace.id, id, user.id)
    const entry = await getLatestChangeLogForSuggestion(client, workspace.id, id)
    if (!entry) {
      throw new SuggestionStateError('Change log entry missing after accept')
    }
    revalidateWorkspacePaths()
    scheduleAdaptation(client, workspace.id)
    return { changeLogId: entry.id, summary: preview.summary }
  })
}

export async function dismissSuggestionAction(
  suggestionId: string
): Promise<SuggestionActionResult> {
  const id = idSchema.parse(suggestionId)
  return withAction(async () => {
    const { workspace, user } = await getCurrentWorkspace()
    const client = await createClient()
    await dismissSuggestion(client, workspace.id, id, user.id)
    revalidateWorkspacePaths()
  })
}

export async function undoLatestChangeAction(
  changeLogId: string
): Promise<SuggestionActionResult> {
  const id = idSchema.parse(changeLogId)
  return withAction(async () => {
    const { workspace, user } = await getCurrentWorkspace()
    const client = await createClient()
    await undoChange(client, workspace.id, id, user.id)
    revalidateWorkspacePaths()
  })
}
