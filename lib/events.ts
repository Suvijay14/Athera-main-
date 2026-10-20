import type { DbClient } from '@/lib/db/db-client'
import { toJson } from '@/lib/db/json'
import type { AppEvent } from '@/lib/db/schemas'
import { appEventNameSchema } from '@/lib/db/schemas'
import { wrapSupabaseError } from '@/lib/db/errors'

export type TrackInput = {
  workspaceId: string
  userId: string
  name: AppEvent['name']
  props?: Record<string, unknown>
}

export async function track(client: DbClient, input: TrackInput): Promise<void> {
  const name = appEventNameSchema.parse(input.name)
  const { error } = await client.from('events').insert({
    workspace_id: input.workspaceId,
    user_id: input.userId,
    name,
    props: toJson(input.props ?? {}),
  })
  if (error) {
    throw wrapSupabaseError('Failed to track event', error)
  }
}
