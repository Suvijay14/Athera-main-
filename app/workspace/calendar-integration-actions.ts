'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { deleteCalendarConnection, getCalendarConnectionForSpace } from '@/lib/db/calendar-connections'
import { getSpaceById } from '@/lib/db/spaces'
import { runGoogleCalendarImportForSpace } from '@/lib/integrations/google-calendar-import'
import { revokeGoogleToken } from '@/lib/integrations/google-calendar/token-refresh'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/supabase/get-current-workspace'

const spaceIdSchema = z.object({
  spaceId: z.string().uuid(),
})

function revalidateSpace(spaceId: string) {
  revalidatePath('/workspace', 'layout')
  revalidatePath(`/workspace/spaces/${spaceId}`)
}

export async function syncGoogleCalendarAction(raw: z.infer<typeof spaceIdSchema>) {
  const { spaceId } = spaceIdSchema.parse(raw)
  const { workspace } = await getCurrentWorkspace()
  const client = await createClient()
  const space = await getSpaceById(client, workspace.id, spaceId)
  if (!space || space.archivedAt) {
    throw new Error('Space not found')
  }

  const result = await runGoogleCalendarImportForSpace(client, workspace.id, spaceId)
  revalidateSpace(spaceId)
  return result
}

export async function disconnectGoogleCalendarAction(raw: z.infer<typeof spaceIdSchema>) {
  const { spaceId } = spaceIdSchema.parse(raw)
  const { workspace } = await getCurrentWorkspace()
  const client = await createClient()
  const space = await getSpaceById(client, workspace.id, spaceId)
  if (!space || space.archivedAt) {
    throw new Error('Space not found')
  }

  const existing = await getCalendarConnectionForSpace(client, workspace.id, spaceId)
  if (!existing) {
    return { disconnected: false as const }
  }

  const tokenToRevoke = existing.refreshToken ?? existing.accessToken
  try {
    await revokeGoogleToken(tokenToRevoke)
  } catch {
    // Still remove local connection if revoke fails (token may already be invalid).
  }

  await deleteCalendarConnection(client, workspace.id, spaceId)
  revalidateSpace(spaceId)
  return { disconnected: true as const }
}
