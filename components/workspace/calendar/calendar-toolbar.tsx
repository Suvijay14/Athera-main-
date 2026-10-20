'use client'

import { format } from 'date-fns'

import { Button } from '@/components/ctc/ui/Button'
import type { FieldDefinition } from '@/lib/db/schemas'
import { cn } from '@/lib/utils'

type CalendarToolbarProps = {
  anchor: Date
  rangeMode: 'week' | 'month'
  onRangeModeChange: (mode: 'week' | 'month') => void
  onNavigate: (direction: -1 | 0 | 1) => void
  colorByFieldKey: string | null
  onColorByChange: (key: string | null) => void
  colorByOptions: FieldDefinition[]
  filterKeys: string[]
  activeFilters: Set<string>
  onToggleFilter: (key: string) => void
  filterLabel: (key: string) => string
  filterColor: (key: string) => string
}

export function CalendarToolbar({
  anchor,
  rangeMode,
  onRangeModeChange,
  onNavigate,
  colorByFieldKey,
  onColorByChange,
  colorByOptions,
  filterKeys,
  activeFilters,
  onToggleFilter,
  filterLabel,
  filterColor,
}: CalendarToolbarProps) {
  const title =
    rangeMode === 'week'
      ? `Week of ${format(anchor, 'MMM d, yyyy')}`
      : format(anchor, 'MMMM yyyy')

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onNavigate(-1)}>
            Prev
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => onNavigate(0)}>
            Today
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => onNavigate(1)}>
            Next
          </Button>
          <span className="text-sm font-medium text-neutral-900">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-neutral-200 p-0.5">
            {(['week', 'month'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                className={cn(
                  'rounded-md px-3 py-1 text-sm capitalize',
                  rangeMode === mode
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:text-neutral-900'
                )}
                onClick={() => onRangeModeChange(mode)}
              >
                {mode}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-600">
            Color by
            <select
              className="rounded-lg border border-neutral-300 px-2 py-1 text-sm text-neutral-900"
              value={colorByFieldKey ?? ''}
              onChange={(e) => onColorByChange(e.target.value || null)}
            >
              <option value="">None</option>
              {colorByOptions.map((f) => (
                <option key={f.id} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      {filterKeys.length > 0 ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Color filters">
          {filterKeys.map((key) => {
            const active = activeFilters.has(key)
            return (
              <button
                key={key}
                type="button"
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium',
                  active ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300 bg-white'
                )}
                style={active ? undefined : { borderColor: filterColor(key), color: filterColor(key) }}
                onClick={() => onToggleFilter(key)}
              >
                {filterLabel(key)}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
