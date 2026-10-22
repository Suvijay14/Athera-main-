'use client'

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { updateViewSettingsAction, updateWorkItemAction } from '@/app/workspace/actions'
import { CalendarMonthView } from '@/components/workspace/calendar/calendar-month-view'
import { CalendarToolbar } from '@/components/workspace/calendar/calendar-toolbar'
import { CalendarWeekView } from '@/components/workspace/calendar/calendar-week-view'
import { UnscheduledTray } from '@/components/workspace/calendar/unscheduled-tray'
import { useWorkspaceUi } from '@/components/workspace/workspace-ui-context'
import type { Entity, FieldDefinition, Space, ViewDefinition, WorkItem } from '@/lib/db/schemas'
import {
  collectColorFilterKeys,
  colorForFilterKey,
  colorForItemField,
  itemMatchesColorFilter,
  labelForColorKey,
} from '@/lib/workspace/calendar-colors'
import { isBuiltinSpaceCalendarViewId } from '@/lib/workspace/builtin-space-views'
import {
  patchForMoveTimedItem,
  patchForScheduleFromTray,
  type CalendarDropTarget,
} from '@/lib/workspace/calendar-drag'
import { bucketCalendarItems } from '@/lib/workspace/calendar-items'
import {
  daysInMonthGrid,
  monthRangeContaining,
  shiftAnchor,
  weekDayColumns,
  weekRangeContaining,
} from '@/lib/workspace/calendar-range'

type CalendarViewProps = {
  view: ViewDefinition
  views: ViewDefinition[]
  items: WorkItem[]
  fields: FieldDefinition[]
  entities: Entity[]
  spaces?: Space[]
}

function defaultColorByKey(view: ViewDefinition, views: ViewDefinition[], fields: FieldDefinition[]): string | null {
  if (view.colorByField) {
    return view.colorByField
  }
  const grouped = views.find((v) => v.type === 'grouped' && v.groupByField)
  if (grouped?.groupByField) {
    return grouped.groupByField
  }
  const entity = fields.find((f) => f.type === 'entity' && f.visible)
  if (entity) {
    return entity.key
  }
  const select = fields.find((f) => f.type === 'select' && f.visible)
  return select?.key ?? null
}

function parseDropTarget(overId: string, data: Record<string, unknown> | undefined): CalendarDropTarget | null {
  if (data?.mode === 'timed' && data.day instanceof Date && typeof data.hour === 'number') {
    return { mode: 'timed', day: data.day, hour: data.hour, minute: 0 }
  }
  if (data?.mode === 'all-day' && data.day instanceof Date) {
    return { mode: 'all-day', day: data.day }
  }
  return null
}

export function CalendarView({ view, views, items, fields, entities, spaces = [] }: CalendarViewProps) {
  const router = useRouter()
  const { openItem, showActivityToast } = useWorkspaceUi()
  const [, startTransition] = useTransition()
  const [localItems, setLocalItems] = useState(items)
  const [anchor, setAnchor] = useState(() => new Date())
  const [rangeMode, setRangeMode] = useState<'week' | 'month'>(view.calendarRange ?? 'week')
  const [colorByKey, setColorByKey] = useState<string | null>(() =>
    defaultColorByKey(view, views, fields)
  )
  const [activeFilters, setActiveFilters] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    setLocalItems(items)
  }, [items])

  useEffect(() => {
    setRangeMode(view.calendarRange ?? 'week')
  }, [view.calendarRange])

  const entitiesById = useMemo(() => new Map(entities.map((e) => [e.id, e])), [entities])
  const spacesById = useMemo(() => new Map(spaces.map((s) => [s.id, s])), [spaces])
  const colorByField = fields.find((f) => f.key === colorByKey)
  const colorByOptions = fields.filter((f) => f.type === 'entity' || f.type === 'select')

  const filteredItems = useMemo(
    () =>
      localItems.filter((item) =>
        itemMatchesColorFilter(item, colorByField, entitiesById, activeFilters)
      ),
    [localItems, colorByField, entitiesById, activeFilters]
  )

  const range = useMemo(
    () => (rangeMode === 'week' ? weekRangeContaining(anchor) : monthRangeContaining(anchor)),
    [anchor, rangeMode]
  )

  const buckets = useMemo(() => bucketCalendarItems(filteredItems, range), [filteredItems, range])
  const filterKeys = useMemo(
    () => collectColorFilterKeys(localItems, colorByField, entitiesById),
    [localItems, colorByField, entitiesById]
  )

  const colorForItem = useCallback(
    (itemId: string) => {
      const item = localItems.find((i) => i.id === itemId)
      if (!item) {
        return '#6366f1'
      }
      return colorForItemField(item, colorByField, entitiesById, spacesById)
    },
    [localItems, colorByField, entitiesById, spacesById]
  )

  const applyPatch = useCallback(
    (itemId: string, patch: Parameters<typeof updateWorkItemAction>[1]) => {
      setLocalItems((prev) =>
        prev.map((it) =>
          it.id === itemId
            ? {
                ...it,
                ...patch,
                data: patch.data ?? it.data,
              }
            : it
        )
      )
      startTransition(async () => {
        try {
          const result = await updateWorkItemAction(itemId, patch)
          if (result.reactivatedEntityName) {
            showActivityToast(`${result.reactivatedEntityName} is active again`)
          }
          router.refresh()
        } catch {
          setLocalItems(items)
        }
      })
    },
    [items, router, showActivityToast]
  )

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) {
      return
    }
    const itemId = String(active.data.current?.itemId ?? '')
    if (!itemId) {
      return
    }
    const item = localItems.find((i) => i.id === itemId)
    if (!item) {
      return
    }
    const target = parseDropTarget(String(over.id), over.data.current as Record<string, unknown>)
    if (!target) {
      return
    }

    const source = active.data.current?.source as string | undefined
    if (source === 'tray') {
      applyPatch(itemId, patchForScheduleFromTray(item, target))
      return
    }
    if (source === 'timed' && target.mode === 'timed') {
      applyPatch(itemId, patchForMoveTimedItem(item, target))
    }
  }

  const persistRangeMode = (mode: 'week' | 'month') => {
    setRangeMode(mode)
    if (isBuiltinSpaceCalendarViewId(view.id)) {
      return
    }
    startTransition(() => {
      void updateViewSettingsAction({ viewId: view.id, calendarRange: mode })
    })
  }

  const persistColorBy = (key: string | null) => {
    setColorByKey(key)
    setActiveFilters(new Set())
    if (isBuiltinSpaceCalendarViewId(view.id)) {
      return
    }
    startTransition(() => {
      void updateViewSettingsAction({ viewId: view.id, colorByField: key })
    })
  }

  const calendarEmpty =
    buckets.timed.length === 0 && buckets.allDay.length === 0 && buckets.unscheduled.length === 0

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      {calendarEmpty ? (
        <p className="mb-4 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-600">
          No dated items in this range — add times in quick-add or drag unscheduled items onto the calendar.
        </p>
      ) : null}
      <CalendarToolbar
        anchor={anchor}
        rangeMode={rangeMode}
        onRangeModeChange={persistRangeMode}
        onNavigate={(dir) => setAnchor(shiftAnchor(anchor, rangeMode, dir))}
        colorByFieldKey={colorByKey}
        onColorByChange={persistColorBy}
        colorByOptions={colorByOptions}
        filterKeys={filterKeys}
        activeFilters={activeFilters}
        onToggleFilter={(key) => {
          setActiveFilters((prev) => {
            const next = new Set(prev)
            if (next.has(key)) {
              next.delete(key)
            } else {
              next.add(key)
            }
            return next
          })
        }}
        filterLabel={(key) => labelForColorKey(key, colorByField, entitiesById)}
        filterColor={(key) => colorForFilterKey(key, entitiesById, spacesById)}
        colorByFieldLabel={colorByField?.label ?? null}
      />
      <div className="flex gap-0">
        {rangeMode === 'week' ? (
          <CalendarWeekView
            days={weekDayColumns(anchor)}
            timed={buckets.timed}
            allDay={buckets.allDay}
            colorForItem={colorForItem}
            onOpenItem={openItem}
            onResizeItem={(id, patch) => applyPatch(id, patch)}
          />
        ) : (
          <CalendarMonthView
            anchor={anchor}
            days={daysInMonthGrid(anchor)}
            timed={buckets.timed}
            allDay={buckets.allDay}
            colorForItem={colorForItem}
            onOpenItem={openItem}
          />
        )}
        <UnscheduledTray
          items={buckets.unscheduled}
          onOpenItem={openItem}
        />
      </div>
    </DndContext>
  )
}
