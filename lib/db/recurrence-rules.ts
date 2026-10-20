import type { DbClient } from './db-client'
import { wrapSupabaseError } from './errors'
import { mapRecurrenceRuleRow } from './mappers'
import type { RecurrenceRule } from './schemas'

export async function listRecurrenceRules(
  client: DbClient,
  workspaceId: string
): Promise<RecurrenceRule[]> {
  const { data, error } = await client
    .from('recurrence_rules')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true })

  if (error) {
    throw wrapSupabaseError('Failed to list recurrence rules', error)
  }
  return (data ?? []).map(mapRecurrenceRuleRow)
}

export async function getRecurrenceRuleById(
  client: DbClient,
  workspaceId: string,
  ruleId: string
): Promise<RecurrenceRule | null> {
  const { data, error } = await client
    .from('recurrence_rules')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('id', ruleId)
    .maybeSingle()

  if (error) {
    throw wrapSupabaseError('Failed to load recurrence rule', error)
  }
  return data ? mapRecurrenceRuleRow(data) : null
}
