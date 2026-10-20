import type { FieldDefinition } from '@/lib/db/schemas'
import { formatFieldDateForDisplay } from '@/lib/workspace/format-item-datetime'

export function isEmptyFieldValue(value: unknown): boolean {
  return value === undefined || value === null || value === ''
}

export function formatFieldReadDisplay(field: FieldDefinition, value: unknown): string {
  if (isEmptyFieldValue(value)) {
    return '—'
  }
  switch (field.type) {
    case 'text':
      return String(value)
    case 'number':
      return String(value)
    case 'date':
      return typeof value === 'string'
        ? formatFieldDateForDisplay(value)
        : formatFieldDateForDisplay(String(value))
    case 'select':
      return String(value)
    case 'checkbox':
      return value === true ? '✓' : '—'
    case 'entity':
      return typeof value === 'string' ? value : String(value)
    default:
      return String(value)
  }
}
