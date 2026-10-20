/**
 * Patch custom-field data on work items.
 * `null` means remove the key (absent in jsonb), not JSON null stored in the object.
 */
export function setDataKey(
  data: Record<string, unknown>,
  key: string,
  value: unknown | null
): Record<string, unknown> {
  const next = { ...data }
  if (value === null) {
    delete next[key]
  } else {
    next[key] = value
  }
  return next
}

export function readDataKey(data: Record<string, unknown>, key: string): unknown | null {
  if (!Object.prototype.hasOwnProperty.call(data, key)) {
    return null
  }
  return data[key] as unknown
}

/** True when the key is missing from data (distinct from an explicit JSON null value). */
export function isKeyAbsent(data: Record<string, unknown>, key: string): boolean {
  return !Object.prototype.hasOwnProperty.call(data, key)
}
