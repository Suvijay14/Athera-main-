import 'server-only'

import type { DbClient } from '@/lib/db/db-client'
import { recordSpaceMoveCorrection } from '@/lib/db/space-move-corrections'
import { track } from '@/lib/events'

/** Logs item_moved_space (no user content) and stores title for classification few-shot. */
export async function logItemMovedSpace(
  client: DbClient,
  input: {
    workspaceId: string
    userId: string
    itemId: string
    fromSpaceId: string
    toSpaceId: string
    title: string
  }
): Promise<void> {
  await Promise.all([
    track(client, {
      workspaceId: input.workspaceId,
      userId: input.userId,
      name: 'item_moved_space',
      props: {
        item_id: input.itemId,
        from_space_id: input.fromSpaceId,
        to_space_id: input.toSpaceId,
      },
    }),
    recordSpaceMoveCorrection(client, {
      workspaceId: input.workspaceId,
      itemId: input.itemId,
      fromSpaceId: input.fromSpaceId,
      toSpaceId: input.toSpaceId,
      title: input.title,
    }),
  ])
}
