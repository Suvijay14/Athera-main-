import 'server-only'

import type { DbClient } from '@/lib/db/db-client'
import { getDefaultSpaceId } from '@/lib/db/spaces'
import { track } from '@/lib/events'
import { parseBrainDump, type BrainDumpSegment } from '@/lib/workspace/parse-brain-dump'
import {
  createBrainDumpCalendarEvent,
  createBrainDumpNote,
  createBrainDumpTask,
} from '@/lib/workspace/workspace-elements'

export type BrainDumpApplyResult = {
  taskCount: number
  eventCount: number
  noteCount: number
  itemIds: string[]
}

async function persistSegment(
  client: DbClient,
  workspaceId: string,
  spaceId: string,
  segment: BrainDumpSegment
): Promise<string | null> {
  if (segment.kind === 'calendar_event' && segment.startAt) {
    const item = await createBrainDumpCalendarEvent(client, workspaceId, {
      title: segment.title,
      spaceId,
      startAt: segment.startAt,
      endAt: segment.endAt,
    })
    return item.id
  }
  if (segment.kind === 'note') {
    const item = await createBrainDumpNote(client, workspaceId, {
      title: segment.title,
      spaceId,
    })
    return item.id
  }
  const item = await createBrainDumpTask(client, workspaceId, {
    title: segment.title,
    spaceId,
    dueDate: segment.dueDate,
  })
  return item.id
}

export async function applyBrainDump(
  client: DbClient,
  workspaceId: string,
  userId: string,
  text: string,
  now = new Date()
): Promise<BrainDumpApplyResult> {
  const spaceId = await getDefaultSpaceId(client, workspaceId)
  const segments = parseBrainDump(text, now)
  const itemIds: string[] = []
  let taskCount = 0
  let eventCount = 0
  let noteCount = 0

  for (const segment of segments) {
    const id = await persistSegment(client, workspaceId, spaceId, segment)
    if (!id) {
      continue
    }
    itemIds.push(id)
    if (segment.kind === 'calendar_event') {
      eventCount += 1
    } else if (segment.kind === 'note') {
      noteCount += 1
    } else {
      taskCount += 1
    }
  }

  await track(client, {
    workspaceId,
    userId,
    name: 'item_created',
    props: {
      source: 'brain_dump_onboarding',
      segment_count: segments.length,
      task_count: taskCount,
      event_count: eventCount,
      note_count: noteCount,
    },
  })

  return { taskCount, eventCount, noteCount, itemIds }
}
