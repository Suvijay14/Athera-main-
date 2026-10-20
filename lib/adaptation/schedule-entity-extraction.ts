import 'server-only'

import type { DbClient } from '@/lib/db/db-client'

import { runEntityExtractionForItem } from './run-entity-extraction'

const DEBOUNCE_MS = 5000
const timers = new Map<string, ReturnType<typeof setTimeout>>()

export function scheduleEntityExtraction(
  client: DbClient,
  workspaceId: string,
  workItemId: string
): void {
  const key = `${workspaceId}:${workItemId}`
  const existing = timers.get(key)
  if (existing) {
    clearTimeout(existing)
  }
  timers.set(
    key,
    setTimeout(() => {
      timers.delete(key)
      void runEntityExtractionForItem(client, workspaceId, workItemId).catch((error) => {
        console.error('runEntityExtractionForItem failed', { workspaceId, workItemId, error })
      })
    }, DEBOUNCE_MS)
  )
}
