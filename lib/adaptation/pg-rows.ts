import { mapFieldDefinitionRow } from '@/lib/db/mappers'
import type { Database } from '@/lib/db/database.types'
import type { FieldDefinition } from '@/lib/db/schemas'

type FieldRow = Database['public']['Tables']['field_definitions']['Row']

export function fieldFromRow(row: FieldRow): FieldDefinition {
  return mapFieldDefinitionRow(row)
}

export function parseDataObject(raw: unknown): Record<string, unknown> {
  if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
    return raw as Record<string, unknown>
  }
  return {}
}

export function parseOptions(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return []
  }
  return raw.filter((v): v is string => typeof v === 'string')
}
