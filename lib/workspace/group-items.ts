import type { Entity, FieldDefinition, WorkItem } from '@/lib/db/schemas'

export type ItemGroup = {
  key: string
  label: string
  items: WorkItem[]
}

const UNASSIGNED_LABEL = 'Unassigned'

export type GroupItemsOptions = {
  fields?: FieldDefinition[]
  entities?: Entity[]
}

function bucketKeyAndLabel(
  groupByField: string,
  raw: unknown,
  opts?: GroupItemsOptions
): { key: string; label: string } {
  const str = String(raw)
  const field = opts?.fields?.find((f) => f.key === groupByField)
  if (field?.type === 'entity' && opts?.entities) {
    const ent = opts.entities.find((e) => e.id === str)
    if (ent) {
      return { key: ent.id, label: ent.name }
    }
  }
  return { key: str, label: str }
}

export function groupItemsByField(
  items: WorkItem[],
  groupByField: string,
  opts?: GroupItemsOptions
): ItemGroup[] {
  const buckets = new Map<string, { label: string; items: WorkItem[] }>()
  const unassigned: WorkItem[] = []

  for (const item of items) {
    const raw = item.data[groupByField]
    if (raw === undefined || raw === null || raw === '') {
      unassigned.push(item)
      continue
    }
    const { key, label } = bucketKeyAndLabel(groupByField, raw, opts)
    const bucket = buckets.get(key) ?? { label, items: [] }
    bucket.items.push(item)
    buckets.set(key, bucket)
  }

  const groups: ItemGroup[] = [...buckets.entries()]
    .sort(([, a], [, b]) => a.label.localeCompare(b.label))
    .map(([key, { label, items: groupItems }]) => ({
      key,
      label,
      items: groupItems,
    }))

  if (unassigned.length > 0) {
    groups.push({
      key: '__unassigned__',
      label: UNASSIGNED_LABEL,
      items: unassigned,
    })
  }

  return groups
}

export function boardColumnsFromSelectOptions(options: string[]): string[] {
  return [...options]
}
