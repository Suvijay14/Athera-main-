import 'server-only'

import type { DbClient } from '@/lib/db/db-client'

import { runEntityExtractionForNote } from './run-entity-extraction-for-note'

const DEBOUNCE_MS = 5000
const timers = new Map<string, ReturnType<typeof setTimeout>>()

export function scheduleNoteEntityExtraction(
  client: DbClient,
  workspaceId: string,
  pageId: string,
  spaceId: string,
  bodyText: string
): void {
  const key = `${workspaceId}:${pageId}`
  const existing = timers.get(key)
  if (existing) {
    clearTimeout(existing)
  }
  timers.set(
    key,
    setTimeout(() => {
      timers.delete(key)
      void runEntityExtractionForNote(client, workspaceId, pageId, spaceId, bodyText).catch(
        (error) => {
          console.error('runEntityExtractionForNote failed', { workspaceId, pageId, error })
        }
      )
    }, DEBOUNCE_MS)
  )
}
