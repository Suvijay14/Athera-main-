'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo } from 'react'

import { WorkItemList } from '@/components/workspace/work-item-list'
import type { Entity, FieldDefinition, WorkItem } from '@/lib/db/schemas'
import { groupItemsByField } from '@/lib/workspace/group-items'

type GroupedViewProps = {
  items: WorkItem[]
  fields: FieldDefinition[]
  entities: Entity[]
  groupByField: string
  itemLabel: string
  viewId: string
}

function parseOpenGroups(raw: string | null): Set<string> | null {
  if (raw === null || raw === '') {
    return null
  }
  return new Set(raw.split(',').filter(Boolean))
}

export function GroupedView({
  items,
  fields,
  entities,
  groupByField,
  itemLabel,
  viewId,
}: GroupedViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paramKey = `g_${viewId}`
  const openParam = searchParams.get(paramKey)
  const openGroups = parseOpenGroups(openParam)

  const groups = useMemo(
    () => groupItemsByField(items, groupByField, { fields, entities }),
    [items, groupByField, fields, entities]
  )

  const isOpen = useCallback(
    (groupKey: string) => {
      if (openGroups === null) {
        return true
      }
      return openGroups.has(groupKey)
    },
    [openGroups]
  )

  function toggleGroup(groupKey: string) {
    const next = new Set(openGroups ?? groups.map((g) => g.key))
    if (next.has(groupKey)) {
      next.delete(groupKey)
    } else {
      next.add(groupKey)
    }
    const params = new URLSearchParams(searchParams.toString())
    params.set(paramKey, [...next].join(','))
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  if (groups.length === 0) {
    return (
      <WorkItemList items={[]} fields={fields} itemLabel={itemLabel} entities={entities} />
    )
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const open = isOpen(group.key)
        return (
          <section key={group.key} className="rounded-lg border border-neutral-200">
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-neutral-900 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
              aria-expanded={open}
              onClick={() => toggleGroup(group.key)}
            >
              <span>{group.label}</span>
              <span className="text-neutral-500">{group.items.length}</span>
            </button>
            {open ? (
              <div className="border-t border-neutral-200 p-2">
                <WorkItemList
                  items={group.items}
                  fields={fields}
                  itemLabel={itemLabel}
                  entities={entities}
                />
              </div>
            ) : null}
          </section>
        )
      })}
    </div>
  )
}
