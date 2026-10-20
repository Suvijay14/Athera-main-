'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

import type { WorkItem } from '@/lib/db/schemas'

type UnscheduledTrayProps = {
  items: WorkItem[]
  onOpenItem: (id: string) => void
}

function TrayRow({ item, onOpenItem }: { item: WorkItem; onOpenItem: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `tray:${item.id}`,
    data: { itemId: item.id, source: 'tray' as const },
  })
  const style = transform
    ? { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.6 : 1 }
    : undefined

  return (
    <li ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <button
        type="button"
        className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-left text-sm hover:bg-neutral-50"
        onClick={() => onOpenItem(item.id)}
      >
        {item.title}
      </button>
    </li>
  )
}

export function UnscheduledTray({ items, onOpenItem }: UnscheduledTrayProps) {
  return (
    <aside className="w-56 shrink-0 border-l border-neutral-200 bg-neutral-50/80 pl-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Unscheduled</h3>
      <p className="mt-1 text-xs text-neutral-500">Drag onto the calendar to schedule.</p>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">Nothing unscheduled.</p>
      ) : (
        <ul className="mt-3 max-h-[70vh] space-y-2 overflow-y-auto pr-1">
          {items.map((item) => (
            <TrayRow key={item.id} item={item} onOpenItem={onOpenItem} />
          ))}
        </ul>
      )}
    </aside>
  )
}
