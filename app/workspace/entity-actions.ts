'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { archiveEntity, getEntityById } from '@/lib/db/entities'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/supabase/get-current-workspace'

export async function archiveEntityAction(entityId: string) {
  const id = z.string().uuid().parse(entityId)
  const { workspace } = await getCurrentWorkspace()
  const client = await createClient()
  const entity = await getEntityById(client, workspace.id, id)
  if (!entity) {
    throw new Error('Entity not found')
  }
  await archiveEntity(client, workspace.id, id)
  revalidatePath('/workspace', 'layout')
}
