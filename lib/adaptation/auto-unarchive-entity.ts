import 'server-only'

import type { DbClient } from '@/lib/db/db-client'
import { getEntityById } from '@/lib/db/entities'
import { applyOperations } from '@/lib/adaptation/apply'
import type { Operation } from '@/lib/adaptation/types'

export type AutoUnarchiveResult = {
  unarchived: boolean
  entityName: string | null
}

export async function autoUnarchiveEntityIfArchived(
  client: DbClient,
  workspaceId: string,
  entityId: string
): Promise<AutoUnarchiveResult> {
  const entity = await getEntityById(client, workspaceId, entityId)
  if (!entity?.archivedAt) {
    return { unarchived: false, entityName: entity?.name ?? null }
  }

  const ops: Operation[] = [{ op: 'unarchive_entity', entityId }]
  await applyOperations(client, workspaceId, ops)
  return { unarchived: true, entityName: entity.name }
}
