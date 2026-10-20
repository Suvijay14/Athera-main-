'use client'

import { Repeat2 } from 'lucide-react'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { deleteWorkItemAction } from '@/app/workspace/actions'
import { Button } from '@/components/ctc/ui/Button'
import { FieldRenderer } from '@/components/workspace/field-renderer'
import { useWorkspaceUi } from '@/components/workspace/workspace-ui-context'
import { EntityChip } from '@/components/workspace/entity-chip'
import type { Entity, FieldDefinition } from '@/lib/db/schemas'
import type { DisplayWorkItem } from '@/lib/workspace/merge-recurrence-display-items'
import { formatWorkItemDueCell } from '@/lib/workspace/format-item-datetime'

type WorkItemListProps = {
  items: DisplayWorkItem[]
  fields: FieldDefinition[]
  itemLabel: string
  itemLabelPlural?: string
  entities?: Entity[]
  loading?: boolean
}

export function WorkItemList({
  items,
  fields,
  itemLabel,
  itemLabelPlural,
  entities = [],
  loading = false,
}: WorkItemListProps) {
  const entityById = new Map(entities.map((e) => [e.id, e]))
  const router = useRouter()
  const { openItem, selectedItemId } = useWorkspaceUi()
  const [, startTransition] = useTransition()
  const visibleFields = fields.filter((f) => f.visible).sort((a, b) => a.position - b.position)
  const plural = itemLabelPlural ?? `${itemLabel}s`

  if (loading) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Loading">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-neutral-200" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-10 text-center text-sm text-neutral-600">
        No {plural} yet. Add one above to get started.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-600">
          <tr>
            <th className="px-3 py-2 font-medium">Title</th>
            <th className="px-3 py-2 font-medium">Due</th>
            {visibleFields.map((f) => (
              <th key={f.id} className="px-3 py-2 font-medium">
                {f.label}
              </th>
            ))}
            <th className="px-3 py-2 font-medium sr-only">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const isSelected = selectedItemId === item.id
            return (
              <tr
                key={item.id}
                className={`cursor-pointer border-b border-neutral-100 hover:bg-neutral-50 ${
                  isSelected ? 'bg-primary/5' : ''
                }`}
                onClick={() => openItem(item.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    openItem(item.id)
                  }
                }}
                tabIndex={0}
                role="button"
                aria-current={isSelected ? 'true' : undefined}
              >
                <td className="px-3 py-2 font-medium text-neutral-900">
                  <span className="inline-flex items-center gap-1.5">
                    {item.recurrenceId || item.isVirtualRecurrence ? (
                      <Repeat2 className="h-3.5 w-3.5 shrink-0 text-neutral-500" aria-hidden />
                    ) : null}
                    {item.title}
                  </span>
                </td>
                <td className="px-3 py-2 text-neutral-600">
                  {formatWorkItemDueCell(item.dueDate, item.startAt)}
                </td>
                  {visibleFields.map((f) => (
                    <td key={f.id} className="px-3 py-2">
                      {f.type === 'entity' && item.data[f.key] ? (
                        (() => {
                          const id = String(item.data[f.key])
                          const ent = entityById.get(id)
                          return ent ? (
                            <EntityChip
                              entityId={ent.id}
                              label={ent.name}
                              spaceId={ent.spaceId}
                              color={ent.color}
                            />
                          ) : (
                            <FieldRenderer field={f} mode="read" value={item.data[f.key]} />
                          )
                        })()
                      ) : (
                        <FieldRenderer field={f} mode="read" value={item.data[f.key]} />
                      )}
                    </td>
                  ))}
                <td className="px-3 py-2 text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-700 hover:text-red-800"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (
                        window.confirm(
                          `Delete this ${itemLabel.toLowerCase()}? This cannot be undone.`
                        )
                      ) {
                        startTransition(async () => {
                          await deleteWorkItemAction(item.id)
                          router.refresh()
                        })
                      }
                    }}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
