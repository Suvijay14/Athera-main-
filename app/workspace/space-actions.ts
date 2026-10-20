'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import {
  archiveSpace,
  createSpace,
  getSpaceById,
  listSpaces,
  renameSpace,
  reorderSpaces,
  unarchiveSpace,
  updateSpace,
} from '@/lib/db/spaces'
import { canArchiveSpace } from '@/lib/workspace/space-guards'
import { createSpaceInputSchema } from '@/lib/db/schemas'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/supabase/get-current-workspace'
import { DbError } from '@/lib/db/errors'

function revalidateWorkspaceRoutes() {
  revalidatePath('/workspace', 'layout')
}

const reorderSchema = z.object({
  orderedSpaceIds: z.array(z.string().uuid()).min(1),
})

const renameSchema = z.object({
  spaceId: z.string().uuid(),
  name: z.string().trim().min(1),
})

const archiveSchema = z.object({
  spaceId: z.string().uuid(),
})

const updateMetaSchema = z.object({
  spaceId: z.string().uuid(),
  icon: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
})

export type CreateSpaceActionResult =
  | { ok: true; space: Awaited<ReturnType<typeof createSpace>> }
  | { ok: false; code: 'upgrade_required'; message: string; limit: 'spaces' | 'open_items' }

export async function createSpaceAction(
  input: z.infer<typeof createSpaceInputSchema>
): Promise<CreateSpaceActionResult> {
  const parsed = createSpaceInputSchema.parse(input)
  const { assertCanCreateSpace } = await import('@/app/workspace/account-actions')
  const gate = await assertCanCreateSpace()
  if (!gate.ok) {
    return { ok: false, code: gate.code, message: gate.message, limit: gate.limit }
  }
  const { workspace } = await getCurrentWorkspace()
  const client = await createClient()
  const existing = await listSpaces(client, workspace.id)
  const space = await createSpace(client, workspace.id, {
    ...parsed,
    sortOrder: parsed.sortOrder ?? existing.length,
  })
  revalidateWorkspaceRoutes()
  return { ok: true, space }
}

export async function renameSpaceAction(raw: z.infer<typeof renameSchema>) {
  const parsed = renameSchema.parse(raw)
  const { workspace } = await getCurrentWorkspace()
  const client = await createClient()
  const space = await renameSpace(client, workspace.id, parsed.spaceId, parsed.name)
  revalidateWorkspaceRoutes()
  return space
}

export async function updateSpaceMetaAction(raw: z.infer<typeof updateMetaSchema>) {
  const parsed = updateMetaSchema.parse(raw)
  const { workspace } = await getCurrentWorkspace()
  const client = await createClient()
  const space = await updateSpace(client, workspace.id, parsed.spaceId, {
    icon: parsed.icon,
    color: parsed.color,
  })
  revalidateWorkspaceRoutes()
  return space
}

export async function archiveSpaceAction(raw: z.infer<typeof archiveSchema>) {
  const parsed = archiveSchema.parse(raw)
  const { workspace } = await getCurrentWorkspace()
  const client = await createClient()
  const space = await getSpaceById(client, workspace.id, parsed.spaceId)
  const guard = canArchiveSpace(space)
  if (!guard.ok) {
    if (guard.reason === 'default_space') {
      throw new DbError('validation', 'Cannot archive the default space')
    }
    throw new DbError('not_found', 'Space not found')
  }
  const archived = await archiveSpace(client, workspace.id, parsed.spaceId)
  revalidateWorkspaceRoutes()
  return archived
}

export async function unarchiveSpaceAction(raw: z.infer<typeof archiveSchema>) {
  const parsed = archiveSchema.parse(raw)
  const { workspace } = await getCurrentWorkspace()
  const client = await createClient()
  const restored = await unarchiveSpace(client, workspace.id, parsed.spaceId)
  revalidateWorkspaceRoutes()
  return restored
}

export async function reorderSpacesAction(raw: z.infer<typeof reorderSchema>) {
  const parsed = reorderSchema.parse(raw)
  const { workspace } = await getCurrentWorkspace()
  const client = await createClient()
  await reorderSpaces(client, workspace.id, parsed.orderedSpaceIds)
  revalidateWorkspaceRoutes()
}
