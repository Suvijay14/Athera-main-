import { randomUUID } from 'node:crypto'

import type { RepeatedEntitySuggestionCandidate } from '@/lib/adaptation/entity-repeated-logic'
import { ENTITY_FIELD_COLORS } from '@/lib/adaptation/entity-colors'
import type { Operation } from '@/lib/adaptation/types'

function fieldKeyForKind(kind: string): string {
  return kind.toLowerCase().replace(/[^a-z0-9_]/g, '_') || 'contact'
}

function labelForKind(kind: string): string {
  const k = kind.toLowerCase()
  if (k === 'client') return 'Client'
  if (k === 'patient') return 'Patient'
  if (k === 'vendor') return 'Vendor'
  if (k === 'student') return 'Student'
  return k.charAt(0).toUpperCase() + k.slice(1)
}

export type RepeatedEntityChildPlan = {
  name: string
  spaceId: string
  color: string
  itemIds: string[]
}

/**
 * Real workspace restructure: parent space renamed, child space per entity, items moved, field + grouped view.
 */
export function buildRepeatedEntityOperations(
  picked: RepeatedEntitySuggestionCandidate
): Operation[] {
  const fieldKey = fieldKeyForKind(picked.kind)
  const kindLabel = labelForKind(picked.kind)
  const parentSpaceId = picked.spaceId
  const parentName = `${kindLabel}s`

  const itemIdsByName = new Map<string, string[]>()
  for (const [itemId, name] of Object.entries(picked.backfillValues)) {
    const display = name.trim()
    if (!display) {
      continue
    }
    const list = itemIdsByName.get(display) ?? []
    list.push(itemId)
    itemIdsByName.set(display, list)
  }

  const names = [...itemIdsByName.keys()].sort((a, b) => a.localeCompare(b))
  const childPlans: RepeatedEntityChildPlan[] = names.map((name, i) => ({
    name,
    spaceId: randomUUID(),
    color: ENTITY_FIELD_COLORS[i % ENTITY_FIELD_COLORS.length] ?? '#6366f1',
    itemIds: itemIdsByName.get(name) ?? [],
  }))

  const ops: Operation[] = [
    {
      op: 'create_field',
      field: {
        key: fieldKey,
        label: kindLabel,
        type: 'entity',
        entityKind: picked.kind,
      },
    },
    {
      op: 'update_space',
      spaceId: parentSpaceId,
      patch: { name: parentName },
    },
  ]

  for (let i = 0; i < childPlans.length; i++) {
    const child = childPlans[i]!
    ops.push({
      op: 'create_space',
      space: {
        name: child.name,
        color: child.color,
        parentSpaceId: parentSpaceId,
        sortOrder: i,
        preserveSpaceId: child.spaceId,
      },
    })
  }

  for (const child of childPlans) {
    ops.push({
      op: 'create_entity',
      entity: {
        spaceId: child.spaceId,
        kind: picked.kind,
        name: child.name,
        color: child.color,
      },
    })
  }

  for (const child of childPlans) {
    for (const itemId of child.itemIds) {
      ops.push({
        op: 'move_work_item_space',
        itemId,
        spaceId: child.spaceId,
      })
    }
  }

  ops.push({
    op: 'backfill_field',
    key: fieldKey,
    values: picked.backfillValues,
  })

  ops.push({
    op: 'create_view',
    view: {
      name: parentName,
      type: 'grouped',
      groupByField: fieldKey,
    },
  })

  return ops
}
