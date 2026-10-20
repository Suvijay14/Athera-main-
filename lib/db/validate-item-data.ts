import type { FieldDefinition, FieldType } from './schemas'

export type ValidateItemDataSuccess = {
  ok: true
  data: Record<string, unknown>
}

export type ValidateItemDataFailure = {
  ok: false
  errors: { key: string; message: string }[]
}

export type ValidateItemDataResult = ValidateItemDataSuccess | ValidateItemDataFailure

function validateValueForType(
  key: string,
  type: FieldType,
  value: unknown,
  options: string[]
): string | null {
  if (value === null) {
    return null
  }

  switch (type) {
    case 'text':
      if (typeof value !== 'string') {
        return `Field "${key}" must be a string`
      }
      return null
    case 'number':
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        return `Field "${key}" must be a finite number`
      }
      return null
    case 'date':
      if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return `Field "${key}" must be an ISO date (yyyy-mm-dd)`
      }
      return null
    case 'select': {
      if (typeof value !== 'string') {
        return `Field "${key}" must be a string`
      }
      if (options.length > 0 && !options.includes(value)) {
        return `Field "${key}" must be one of: ${options.join(', ')}`
      }
      return null
    }
    case 'checkbox':
      if (typeof value !== 'boolean') {
        return `Field "${key}" must be a boolean`
      }
      return null
    case 'entity':
      if (typeof value !== 'string' || !/^[0-9a-f-]{36}$/i.test(value)) {
        return `Field "${key}" must be an entity id (UUID)`
      }
      return null
    default:
      return `Unknown field type for "${key}"`
  }
}

export function validateItemData(
  data: Record<string, unknown>,
  fieldDefinitions: FieldDefinition[]
): ValidateItemDataResult {
  const byKey = new Map(fieldDefinitions.map((f) => [f.key, f]))
  const errors: { key: string; message: string }[] = []
  const normalized: Record<string, unknown> = {}

  for (const key of Object.keys(data)) {
    const def = byKey.get(key)
    if (!def) {
      errors.push({ key, message: `Unknown field key "${key}"` })
      continue
    }
    const message = validateValueForType(key, def.type, data[key], def.options)
    if (message) {
      errors.push({ key, message })
    } else if (data[key] === null) {
      normalized[key] = null
    } else {
      normalized[key] = data[key]
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return { ok: true, data: normalized }
}
