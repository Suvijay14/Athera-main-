'use client'

import type { FieldDefinition, WorkItem } from '@/lib/db/schemas'
import { boardColumnsFromSelectOptions } from '@/lib/workspace/group-items'

type BoardViewProps = {
  items: WorkItem[]
  groupByField: FieldDefinition
}

export function BoardView({ items, groupByField }: BoardViewProps) {
  const columns =
    groupByField.type === 'select' && groupByField.options.length > 0
      ? boardColumnsFromSelectOptions(groupByField.options)
      : []

  const columnItems = new Map<string, WorkItem[]>()
  for (const col of columns) {
    columnItems.set(col, [])
  }
  const unassigned: WorkItem[] = []

  for (const item of items) {
    const raw = item.data[groupByField.key]
    if (raw === undefined || raw === null || raw === '') {
      unassigned.push(item)
      continue
    }
    const key = String(raw)
    if (!columnItems.has(key)) {
      columnItems.set(key, [])
    }
    columnItems.get(key)!.push(item)
  }

  const allColumns = [...columns]
  if (unassigned.length > 0 || columns.length === 0) {
    allColumns.push('Unassigned')
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {allColumns.map((col) => {
        const colItems =
          col === 'Unassigned' ? unassigned : (columnItems.get(col) ?? [])
        return (
          <div
            key={col}
            className="min-w-[220px] flex-shrink-0 rounded-lg border border-neutral-200 bg-neutral-50"
          >
            <div className="border-b border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-800">
              {col}
              <span className="ml-2 text-neutral-500">{colItems.length}</span>
            </div>
            <ul className="space-y-2 p-2">
              {colItems.length === 0 ? (
                <li className="px-2 py-4 text-center text-xs text-neutral-500">
                  No items in this column — drag one here or add above.
                </li>
              ) : (
                colItems.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm"
                  >
                    <p className="font-medium text-neutral-900">{item.title}</p>
                    {item.dueDate ? (
                      <p className="mt-1 text-xs text-neutral-500">Due {item.dueDate}</p>
                    ) : null}
                  </li>
                ))
              )}
            </ul>
          </div>
        )
      })}
      {allColumns.length === 0 ? (
        <p className="text-sm text-neutral-600">
          Add options to the “{groupByField.label}” field to use a board view.
        </p>
      ) : null}
    </div>
  )
}
