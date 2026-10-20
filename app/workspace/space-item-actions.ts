'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { getItemById, updateItem } from '@/lib/db/items'
import { logItemMovedSpace } from '@/lib/workspace/log-item-moved-space'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/supabase/get-current-workspace'

const moveSchema = z.object({
  itemId: z.string().uuid(),
  toSpaceId: z.string().uuid(),
})

export async function moveWorkItemToSpaceAction(input: z.infer<typeof moveSchema>) {
  const { itemId, toSpaceId } = moveSchema.parse(input)
  const { workspace, user } = await getCurrentWorkspace()
  const client = await createClient()

  const item = await getItemById(client, workspace.id, itemId)
  if (!item) {
    throw new Error('Item not found')
  }
  if (item.spaceId === toSpaceId) {
    return item
  }

  const updated = await updateItem(client, workspace.id, itemId, {
    spaceId: toSpaceId,
    spaceConfidence: 1,
  })

  await logItemMovedSpace(client, {
    workspaceId: workspace.id,
    userId: user.id,
    itemId,
    fromSpaceId: item.spaceId,
    toSpaceId,
    title: item.title,
  })

  revalidatePath('/workspace')
  revalidatePath('/')
  revalidatePath('/workspace/overview')
  return updated
}
