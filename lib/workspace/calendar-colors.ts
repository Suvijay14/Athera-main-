import type { Entity, FieldDefinition, WorkItem } from '@/lib/db/schemas'

const SELECT_PALETTE = [
  '#6366f1',
  '#0891b2',
  '#059669',
  '#d97706',
  '#dc2626',
  '#9333ea',
  '#db2777',
  '#4f46e5',
] as const

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

export function colorForSelectValue(value: string): string {
  const idx = hashString(value.toLowerCase()) % SELECT_PALETTE.length
  return SELECT_PALETTE[idx] ?? '#6366f1'
}

export function colorKeyForItemField(
  item: WorkItem,
  field: FieldDefinition | undefined,
  entitiesById: Map<string, Entity>
): string | null {
  if (!field) {
    return null
  }
  const raw = item.data[field.key]
  if (raw === undefined || raw === null || raw === '') {
    return null
  }
  if (field.type === 'entity' && typeof raw === 'string') {
    const ent = entitiesById.get(raw)
    return ent ? `entity:${ent.id}` : null
  }
  if (field.type === 'select') {
    return `select:${String(raw)}`
  }
  return null
}

export function colorForItemField(
  item: WorkItem,
  field: FieldDefinition | undefined,
  entitiesById: Map<string, Entity>
): string {
  if (!field) {
    return '#6366f1'
  }
  const raw = item.data[field.key]
  if (raw === undefined || raw === null || raw === '') {
    return '#a3a3a3'
  }
  if (field.type === 'entity' && typeof raw === 'string') {
    const ent = entitiesById.get(raw)
    return ent?.color ?? '#6366f1'
  }
  if (field.type === 'select') {
    return colorForSelectValue(String(raw))
  }
  return '#6366f1'
}

export function labelForColorKey(
  key: string,
  field: FieldDefinition | undefined,
  entitiesById: Map<string, Entity>
): string {
  if (key.startsWith('entity:')) {
    const id = key.slice('entity:'.length)
    return entitiesById.get(id)?.name ?? 'Entity'
  }
  if (key.startsWith('select:')) {
    return key.slice('select:'.length)
  }
  void field
  return key
}

export function collectColorFilterKeys(
  items: WorkItem[],
  field: FieldDefinition | undefined,
  entitiesById: Map<string, Entity>
): string[] {
  const keys = new Set<string>()
  for (const item of items) {
    const k = colorKeyForItemField(item, field, entitiesById)
    if (k) {
      keys.add(k)
    }
  }
  return [...keys].sort()
}

export function itemMatchesColorFilter(
  item: WorkItem,
  field: FieldDefinition | undefined,
  entitiesById: Map<string, Entity>,
  activeFilters: Set<string>
): boolean {
  if (activeFilters.size === 0) {
    return true
  }
  const key = colorKeyForItemField(item, field, entitiesById)
  if (!key) {
    return false
  }
  return activeFilters.has(key)
}
