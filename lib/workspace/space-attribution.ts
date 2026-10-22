import type { FieldDefinition, Space, ViewDefinition } from '@/lib/db/schemas'

import { buildChildSpacesByParentId } from './space-hierarchy'

/**
 * Plain-language description of how Athera reshaped this space (without the suffix).
 */
export function describeSpaceAdaptation(
  space: Space,
  spaces: Space[],
  fields: FieldDefinition[],
  views: ViewDefinition[]
): string | null {
  const childByParent = buildChildSpacesByParentId(spaces)
  const childSpaces = childByParent.get(space.id) ?? []
  if (childSpaces.length > 0) {
    const entityField = fields.find((f) => f.type === 'entity' && f.source === 'athera' && f.visible)
    if (entityField) {
      return `Grouped by ${entityField.label.toLowerCase()}`
    }
    return 'Split into spaces'
  }

  const groupedView = views.find(
    (v) => v.source === 'athera' && v.type === 'grouped' && v.groupByField && v.visible
  )
  if (groupedView?.groupByField) {
    const field = fields.find((f) => f.key === groupedView.groupByField)
    if (field) {
      return `Grouped by ${field.label.toLowerCase()}`
    }
  }

  const calendarView = views.find((v) => v.source === 'athera' && v.type === 'calendar' && v.visible)
  if (calendarView) {
    return 'Calendar view added'
  }

  return null
}

export function formatCreatedByAthera(description: string): string {
  return `${description} · created by Athera`
}
