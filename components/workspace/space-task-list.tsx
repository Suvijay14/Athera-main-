'use client'

import { Briefcase, FileText, Phone, Repeat2 } from 'lucide-react'
import { useWorkspaceUi } from '@/components/workspace/workspace-ui-context'
import type { Entity, FieldDefinition, Space } from '@/lib/db/schemas'
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

export function SpaceTaskList({
  items,
  fields,
  entities,
  space,
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

  return (
    <ul className="divide-y divide-border-delicate rounded-xl border border-border-delicate bg-surface-paper">
      {items.map((item) => {
        const selected = selectedItemId === item.id
        const rowTitle = formatSpaceListRowTitle(item, entities, fields, space.name)
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
              {item.recurrenceId || item.isVirtualRecurrence ? (
                <Repeat2 className="h-3.5 w-3.5 shrink-0 text-ink-faint" aria-hidden />
              ) : null}
              <span className="shrink-0 tabular-nums text-ink-muted">{when}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
