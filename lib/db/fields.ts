import type { DbClient } from './db-client'
import { wrapSupabaseError } from './errors'
import { mapFieldDefinitionRow } from './mappers'
import type { CreateFieldInput, FieldDefinition } from './schemas'
import { createFieldInputSchema } from './schemas'

export async function listFields(client: DbClient, workspaceId: string): Promise<FieldDefinition[]> {
  const { data, error } = await client
    .from('field_definitions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    throw wrapSupabaseError('Failed to list fields', error)
  }
  return (data ?? []).map(mapFieldDefinitionRow)
}

export async function createField(
  client: DbClient,
  workspaceId: string,
  input: CreateFieldInput
): Promise<FieldDefinition> {
  const parsed = createFieldInputSchema.parse(input)
  const { data, error } = await client
    .from('field_definitions')
    .insert({
      workspace_id: workspaceId,
      key: parsed.key,
      label: parsed.label,
      type: parsed.type,
      options: parsed.options,
      entity_kind: parsed.type === 'entity' ? parsed.entityKind ?? null : null,
      visible: parsed.visible,
      position: parsed.position,
      source: parsed.source,
    })
    .select('*')
    .single()

  if (error) {
    throw wrapSupabaseError('Failed to create field', error)
  }
  return mapFieldDefinitionRow(data)
}

export async function updateFieldLabel(
  client: DbClient,
  workspaceId: string,
  key: string,
  label: string
): Promise<FieldDefinition> {
  const { data, error } = await client
    .from('field_definitions')
    .update({ label })
    .eq('workspace_id', workspaceId)
    .eq('key', key)
    .select('*')
    .single()

  if (error) {
    throw wrapSupabaseError('Failed to update field label', error)
  }
  return mapFieldDefinitionRow(data)
}

export async function setFieldVisibility(
  client: DbClient,
  workspaceId: string,
  key: string,
  visible: boolean
): Promise<FieldDefinition> {
  const { data, error } = await client
    .from('field_definitions')
    .update({ visible })
    .eq('workspace_id', workspaceId)
    .eq('key', key)
    .select('*')
    .single()

  if (error) {
    throw wrapSupabaseError('Failed to update field visibility', error)
  }
  return mapFieldDefinitionRow(data)
}
