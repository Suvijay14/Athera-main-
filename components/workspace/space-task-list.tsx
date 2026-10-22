'use client'

import { Briefcase, FileText, Phone, Repeat2 } from 'lucide-react'
import { useWorkspaceUi } from '@/components/workspace/workspace-ui-context'
import type { Entity, FieldDefinition, RecurrenceRule, Space } from '@/lib/db/schemas'
import { formatRecurrencePill } from '@/lib/workspace/recurrence'
import { spaceNavInitial } from '@/lib/workspace/space-hierarchy'
import { spaceDisplayColor } from '@/lib/workspace/space-display-color'
import type { DisplayWorkItem } from '@/lib/workspace/merge-recurrence-display-items'
import { inferTaskRowIconKind } from '@/lib/workspace/infer-task-row-icon'
import {
  formatSpaceListRowTitle,
  formatSpaceListRowWhen,
} from '@/lib/workspace/space-list-row-format'

type SpaceTaskListProps = {
  items: DisplayWorkItem[]
  fields: FieldDefinition[]
  entities: Entity[]
  space: Space
  /** When set, items are shown in sections per child space (parent space list). */
  childSpaces?: Space[]
  recurrenceRules?: RecurrenceRule[]
  quietEntityWeeks?: Record<string, number>
  itemLabel: string
  loading?: boolean
}

function RowIcon({ title }: { title: string }) {
  const kind = inferTaskRowIconKind(title)
  const className = 'h-4 w-4 shrink-0 text-ink-faint'
  if (kind === 'call') {
    return <Phone className={className} aria-hidden />
  }
  if (kind === 'deliverable') {
    return <FileText className={className} aria-hidden />
  }
  return <Briefcase className={className} aria-hidden />
}

function TaskRows({
  items,
  fields,
  entities,
  spaceName,
  recurrenceRules,
  openItem,
  selectedItemId,
}: {
  items: DisplayWorkItem[]
  fields: FieldDefinition[]
  entities: Entity[]
  recurrenceRules: RecurrenceRule[]
  spaceName: string
  openItem: (id: string) => void
  selectedItemId: string | null
}) {
  const ruleById = new Map(recurrenceRules.map((r) => [r.id, r]))
  return (
    <>
      {items.map((item) => {
        const selected = selectedItemId === item.id
        const rowTitle = formatSpaceListRowTitle(item, entities, fields, spaceName)
        const when = formatSpaceListRowWhen(item)
        return (
          <li key={item.id}>
            <button
              type="button"
              className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-surface-container/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/30 ${
                selected ? 'bg-surface-container/80' : ''
              }`}
              onClick={() => openItem(item.id)}
            >
              <RowIcon title={item.title} />
              <span className="min-w-0 flex-1 font-medium text-ink-primary">{rowTitle}</span>
              {item.source === 'import' ? (
                <span className="hidden shrink-0 rounded-full bg-surface-container px-2 py-0.5 text-[11px] text-ink-muted sm:inline">
                  From notes
                </span>
              ) : null}
              {item.recurrenceId ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-container px-2 py-0.5 text-[11px] font-medium text-ink-muted">
                  <Repeat2 className="h-3 w-3" aria-hidden />
                  {ruleById.get(item.recurrenceId)
                    ? formatRecurrencePill(ruleById.get(item.recurrenceId)!)
                    : 'Repeats'}
                </span>
              ) : null}
              <span className="shrink-0 tabular-nums text-ink-muted">{when}</span>
            </button>
          </li>
        )
      })}
    </>
  )
}

export function SpaceTaskList({
  items,
  fields,
  entities,
  space,
  childSpaces = [],
  recurrenceRules = [],
  quietEntityWeeks = {},
  itemLabel,
  loading = false,
}: SpaceTaskListProps) {
  const { openItem, selectedItemId } = useWorkspaceUi()
  const plural = `${itemLabel}s`

  if (loading) {
    return (
      <div className="space-y-2" aria-busy="true">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-surface-container" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border-delicate bg-surface-paper/50 px-4 py-10 text-center text-sm text-ink-muted">
        No {plural} yet. Add one above to get started.
      </p>
    )
  }

  if (childSpaces.length > 0) {
    const childById = new Map(childSpaces.map((s) => [s.id, s]))
    const groups = new Map<string, DisplayWorkItem[]>()
    const parentItems: DisplayWorkItem[] = []
    for (const item of items) {
      const child = childById.get(item.spaceId)
      if (child) {
        const list = groups.get(child.id) ?? []
        list.push(item)
        groups.set(child.id, list)
      } else if (item.spaceId === space.id) {
        parentItems.push(item)
      }
    }

    return (
      <div className="space-y-6">
        {childSpaces.map((child) => {
          const groupItems = groups.get(child.id) ?? []
          const childEntity = entities.find((e) => e.spaceId === child.id)
          const quietWeeks = childEntity ? quietEntityWeeks[childEntity.id] : undefined
          return (
            <section key={child.id}>
              <div className="mb-2 flex items-center gap-2 px-1">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: spaceDisplayColor(child) }}
                  aria-hidden
                >
                  {spaceNavInitial(child.name)}
                </span>
                <h2 className="text-sm font-semibold text-ink-primary">{child.name}</h2>
                <span className="text-xs text-ink-faint">
                  {groupItems.length === 0
                    ? `No open items${quietWeeks ? ` · quiet for ${quietWeeks} week${quietWeeks === 1 ? '' : 's'}` : ''}`
                    : `${groupItems.length} item${groupItems.length === 1 ? '' : 's'}`}
                </span>
              </div>
              {groupItems.length > 0 ? (
                <ul className="divide-y divide-border-delicate rounded-xl border border-border-delicate bg-surface-paper">
                  <TaskRows
                    items={groupItems}
                    fields={fields}
                    entities={entities}
                    recurrenceRules={recurrenceRules}
                    spaceName={child.name}
                    openItem={openItem}
                    selectedItemId={selectedItemId}
                  />
                </ul>
              ) : null}
            </section>
          )
        })}
        {parentItems.length > 0 ? (
          <section>
            <div className="mb-2 px-1 text-sm font-semibold text-ink-muted">Other</div>
            <ul className="divide-y divide-border-delicate rounded-xl border border-border-delicate bg-surface-paper">
              <TaskRows
                items={parentItems}
                fields={fields}
                entities={entities}
                recurrenceRules={recurrenceRules}
                spaceName={space.name}
                openItem={openItem}
                selectedItemId={selectedItemId}
              />
            </ul>
          </section>
        ) : null}
      </div>
    )
  }

  return (
    <ul className="divide-y divide-border-delicate rounded-xl border border-border-delicate bg-surface-paper">
      <TaskRows
        items={items}
        fields={fields}
        entities={entities}
        recurrenceRules={recurrenceRules}
        spaceName={space.name}
        openItem={openItem}
        selectedItemId={selectedItemId}
      />
    </ul>
  )
}
