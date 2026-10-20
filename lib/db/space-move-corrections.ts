import type { DbClient } from './db-client'
import { wrapSupabaseError } from './errors'

/** PostgREST / Postgres when `space_move_corrections` migration is not applied yet. */
function isSpaceMoveCorrectionsTableMissing(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false
  }
  const code = (error as { code?: string }).code
  const message = String((error as { message?: string }).message ?? '')
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    (message.includes('space_move_corrections') &&
      (message.includes('does not exist') || message.includes('Could not find')))
  )
}

export type SpaceMoveCorrection = {
  title: string
  toSpaceId: string
}

export type RecordSpaceMoveCorrectionInput = {
  workspaceId: string
  itemId: string
  fromSpaceId: string
  toSpaceId: string
  title: string
}

/** Persist a manual move for few-shot classification (not in events). */
export async function recordSpaceMoveCorrection(
  client: DbClient,
  input: RecordSpaceMoveCorrectionInput
): Promise<void> {
  const { error } = await client.from('space_move_corrections').insert({
    workspace_id: input.workspaceId,
    item_id: input.itemId,
    from_space_id: input.fromSpaceId,
    to_space_id: input.toSpaceId,
    title: input.title.trim(),
  })
  if (error) {
    if (isSpaceMoveCorrectionsTableMissing(error)) {
      console.warn(
        'space_move_corrections table missing; apply supabase/migrations/20261015130000_space_move_corrections.sql'
      )
      return
    }
    throw wrapSupabaseError('Failed to record space move correction', error)
  }
}

/** Last N manual space moves for few-shot classification. */
export async function listRecentSpaceMoveCorrections(
  client: DbClient,
  workspaceId: string,
  limit = 20
): Promise<SpaceMoveCorrection[]> {
  const { data, error } = await client
    .from('space_move_corrections')
    .select('title, to_space_id, created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    if (isSpaceMoveCorrectionsTableMissing(error)) {
      console.warn(
        'space_move_corrections table missing; few-shot space classification disabled until migration is applied'
      )
      return []
    }
    throw wrapSupabaseError('Failed to load space move corrections', error)
  }

  return (data ?? []).map((row) => ({
    title: row.title as string,
    toSpaceId: row.to_space_id as string,
  }))
}
