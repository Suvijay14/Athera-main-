import type { Database } from './database.types'
import type { DbClient } from './db-client'
import { toJson } from './json'
import { DbError, wrapSupabaseError } from './errors'
import { mapWorkspaceRow } from './mappers'
import type { UpdateWorkspaceInput, Workspace } from './schemas'
import { updateWorkspaceInputSchema } from './schemas'

export async function getWorkspaceForUser(client: DbClient, userId: string): Promise<Workspace | null> {
  const { data, error } = await client
    .from('workspaces')
    .select('*')
    .eq('owner_id', userId)
    .maybeSingle()

  if (error) {
    throw wrapSupabaseError('Failed to load workspace', error)
  }
  return data ? mapWorkspaceRow(data) : null
}

export async function createWorkspaceForUser(client: DbClient, userId: string): Promise<Workspace> {
  const { data: authData, error: authError } = await client.auth.getUser()
  if (authError || !authData.user) {
    throw new DbError('forbidden', 'Not authenticated')
  }
  if (authData.user.id !== userId) {
    throw new DbError('forbidden', 'Session user mismatch')
  }

  const { data, error } = await client.rpc('ensure_workspace_for_user')
  if (error) {
    throw wrapSupabaseError('Failed to bootstrap workspace', error)
  }

  const row = data as Database['public']['Tables']['workspaces']['Row'] | null
  if (!row?.id) {
    throw new DbError('unknown', 'Workspace missing after bootstrap')
  }
  return mapWorkspaceRow(row)
}

export async function updateWorkspace(
  client: DbClient,
  workspaceId: string,
  patch: UpdateWorkspaceInput
): Promise<Workspace> {
  const parsed = updateWorkspaceInputSchema.parse(patch)
  const row: Record<string, unknown> = {}
  if (parsed.name !== undefined) row.name = parsed.name
  if (parsed.businessType !== undefined) row.business_type = parsed.businessType
  if (parsed.itemLabel !== undefined) row.item_label = parsed.itemLabel
  if (parsed.onboardingAnswers !== undefined) {
    row.onboarding_answers = toJson(parsed.onboardingAnswers)
  }

  if (Object.keys(row).length === 0) {
    const { data, error } = await client.from('workspaces').select('*').eq('id', workspaceId).single()
    if (error) {
      throw wrapSupabaseError('Failed to load workspace', error)
    }
    return mapWorkspaceRow(data)
  }

  const { data, error } = await client
    .from('workspaces')
    .update(row as Database['public']['Tables']['workspaces']['Update'])
    .eq('id', workspaceId)
    .select('*')
    .single()

  if (error) {
    throw wrapSupabaseError('Failed to update workspace', error)
  }
  return mapWorkspaceRow(data)
}
