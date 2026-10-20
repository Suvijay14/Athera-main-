import 'server-only'

import type { DbClient } from '@/lib/db/db-client'

import { runAdaptation } from './engine'

const DEBOUNCE_MS = 5000
const lastScheduled = new Map<string, number>()

export function scheduleAdaptation(client: DbClient, workspaceId: string): void {
  const now = Date.now()
  const last = lastScheduled.get(workspaceId) ?? 0
  if (now - last < DEBOUNCE_MS) {
    return
  }
  lastScheduled.set(workspaceId, now)

  void runAdaptation(client, workspaceId).catch((error) => {
    console.error('runAdaptation failed', { workspaceId, error })
  })
}
