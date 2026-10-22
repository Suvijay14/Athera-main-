import type { ViewDefinition } from '@/lib/db/schemas'

/** Stable id for the built-in space calendar (not stored in view_definitions). */
export const BUILTIN_SPACE_CALENDAR_VIEW_ID = '00000000-0000-4000-8000-0000000000c1'

export function isBuiltinSpaceCalendarViewId(viewId: string): boolean {
  return viewId === BUILTIN_SPACE_CALENDAR_VIEW_ID
}

export function builtinSpaceCalendarView(workspaceId: string): ViewDefinition {
  return {
    id: BUILTIN_SPACE_CALENDAR_VIEW_ID,
    workspaceId,
    name: 'Calendar',
    type: 'calendar',
    groupByField: null,
    colorByField: null,
    calendarRange: 'week',
    filters: {},
    visible: true,
    position: 0,
    source: 'user',
    createdAt: '1970-01-01T00:00:00.000Z',
  }
}

/** Custom views shown in tabs (excludes DB calendar rows — Calendar is always built-in). */
export function spaceTabViews(views: ViewDefinition[]): ViewDefinition[] {
  return views.filter((v) => v.type !== 'calendar')
}
