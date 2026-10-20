import type { Entity, FieldDefinition, ViewDefinition } from '@/lib/db/schemas'

export type CommandBarChipItem = {
  startAt: string | null
  dueDate: string | null
}

export type CommandBarChip = {
  id: string
  label: string
  /** Text sent to view-request parser when selected. */
  requestText?: string
  action: 'view_request' | 'create'
}

function spaceHasDatedItems(items: CommandBarChipItem[]): boolean {
  return items.some((i) => Boolean(i.startAt?.trim()) || Boolean(i.dueDate?.trim()))
}

function hasCalendarView(views: ViewDefinition[]): boolean {
  return views.some((v) => v.type === 'calendar' && v.visible)
}

export function deriveCommandBarChips(input: {
  spaceItems: CommandBarChipItem[]
  spaceEntities: Entity[]
  fields: FieldDefinition[]
  views: ViewDefinition[]
  activeViewId: string | null
}): CommandBarChip[] {
  const chips: CommandBarChip[] = []
  const activeView = input.activeViewId
    ? input.views.find((v) => v.id === input.activeViewId)
    : undefined

  if (spaceHasDatedItems(input.spaceItems) && !hasCalendarView(input.views)) {
    chips.push({
      id: 'calendar',
      label: 'Show as calendar',
      requestText: 'save a calendar view for this week',
      action: 'view_request',
    })
  }

  const entityField = input.fields.find((f) => f.type === 'entity' && f.visible)
  if (entityField) {
    const groupedByEntity =
      activeView?.type === 'grouped' && activeView.groupByField === entityField.key
    if (!groupedByEntity) {
      chips.push({
        id: `group-${entityField.key}`,
        label: `Group by ${entityField.label}`,
        requestText: `group by ${entityField.label.toLowerCase()}`,
        action: 'view_request',
      })
    }
  }

  const sortedEntities = [...input.spaceEntities]
    .sort((a, b) => {
      const aT = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0
      const bT = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0
      return bT - aT
    })
    .slice(0, 2)

  for (const ent of sortedEntities) {
    chips.push({
      id: `only-${ent.id}`,
      label: `Only ${ent.name}`,
      requestText: `only ${ent.name}`,
      action: 'view_request',
    })
  }

  chips.push({
    id: 'add-task',
    label: 'Add a task',
    action: 'create',
  })

  const fallbacks: CommandBarChip[] = [
    {
      id: 'week',
      label: 'Show this week',
      requestText: 'save a calendar view for this week',
      action: 'view_request',
    },
    {
      id: 'month',
      label: 'Show this month',
      requestText: 'save a calendar view for this month',
      action: 'view_request',
    },
  ]

  while (chips.length < 4 && fallbacks.length > 0) {
    const next = fallbacks.shift()
    if (next && !chips.some((c) => c.id === next.id)) {
      chips.push(next)
    }
  }

  return chips.slice(0, 6)
}

export function filterCommandBarChips(chips: CommandBarChip[], query: string): CommandBarChip[] {
  const q = query.trim().toLowerCase()
  if (!q) {
    return chips
  }
  return chips.filter((c) => c.label.toLowerCase().includes(q))
}
