'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import {
  createFieldAction,
  createViewAction,
  renameFieldAction,
  setFieldVisibilityAction,
} from '@/app/workspace/actions'
import { Button } from '@/components/ctc/ui/Button'
import type { FieldDefinition, ViewDefinition } from '@/lib/db/schemas'
import { fieldKeySchema } from '@/lib/db/schemas'

type FieldManagerProps = {
  open: boolean
  onClose: () => void
  fields: FieldDefinition[]
  views: ViewDefinition[]
}

function slugifyLabel(label: string): string {
  const base = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40)
  return base.match(/^[a-z]/) ? base : `f_${base}`.slice(0, 40)
}

export function FieldManager({ open, onClose, fields, views }: FieldManagerProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [newLabel, setNewLabel] = useState('')
  const [newType, setNewType] = useState<'text' | 'select'>('text')
  const [newOptions, setNewOptions] = useState('')
  const [viewName, setViewName] = useState('')
  const [viewType, setViewType] = useState<'list' | 'grouped' | 'board' | 'calendar'>('grouped')
  const [calendarRange, setCalendarRange] = useState<'week' | 'month'>('week')
  const [viewGroupField, setViewGroupField] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/30"
      role="dialog"
      aria-modal="true"
      aria-labelledby="field-manager-title"
    >
      <div className="flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <h2 id="field-manager-title" className="text-lg font-semibold text-neutral-900">
            Manage fields
          </h2>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <ul className="space-y-3">
            {fields.map((field) => (
              <li key={field.id} className="rounded-lg border border-neutral-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <input
                    className="flex-1 rounded border border-neutral-300 px-2 py-1 text-sm"
                    defaultValue={field.label}
                    onBlur={(e) => {
                      const label = e.target.value.trim()
                      if (label && label !== field.label) {
                        startTransition(async () => {
                          await renameFieldAction(field.key, label)
                          router.refresh()
                        })
                      }
                    }}
                  />
                  <label className="flex items-center gap-1 text-xs text-neutral-600">
                    <input
                      type="checkbox"
                      checked={field.visible}
                      onChange={(e) => {
                        startTransition(async () => {
                          await setFieldVisibilityAction(field.key, e.target.checked)
                          router.refresh()
                        })
                      }}
                    />
                    Visible
                  </label>
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  {field.type} · {field.key}
                </p>
              </li>
            ))}
          </ul>
          <section>
            <h3 className="text-sm font-medium text-neutral-800">Add field</h3>
            <div className="mt-2 space-y-2">
              <input
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                placeholder="Label"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
              />
              <select
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                value={newType}
                onChange={(e) => setNewType(e.target.value as 'text' | 'select')}
              >
                <option value="text">Text</option>
                <option value="select">Select</option>
              </select>
              {newType === 'select' ? (
                <input
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  placeholder="Options (comma-separated)"
                  value={newOptions}
                  onChange={(e) => setNewOptions(e.target.value)}
                />
              ) : null}
              <Button
                type="button"
                size="sm"
                disabled={pending || !newLabel.trim()}
                onClick={() => {
                  setError(null)
                  const key = slugifyLabel(newLabel)
                  try {
                    fieldKeySchema.parse(key)
                  } catch {
                    setError('Could not derive a valid field key from that label')
                    return
                  }
                  startTransition(async () => {
                    try {
                      await createFieldAction({
                        key,
                        label: newLabel.trim(),
                        type: newType,
                        options:
                          newType === 'select'
                            ? newOptions.split(',').map((s) => s.trim()).filter(Boolean)
                            : [],
                        visible: true,
                        position: fields.length,
                        source: 'user',
                      })
                      setNewLabel('')
                      setNewOptions('')
                      router.refresh()
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Failed to add field')
                    }
                  })
                }}
              >
                Add field
              </Button>
            </div>
          </section>
          <section>
            <h3 className="text-sm font-medium text-neutral-800">Add view</h3>
            <div className="mt-2 space-y-2">
              <input
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                placeholder="View name"
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
              />
              <select
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                value={viewType}
                onChange={(e) =>
                  setViewType(e.target.value as 'list' | 'grouped' | 'board' | 'calendar')
                }
              >
                <option value="list">List</option>
                <option value="grouped">Grouped</option>
                <option value="board">Board</option>
                <option value="calendar">Calendar</option>
              </select>
              {viewType === 'calendar' ? (
                <select
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  value={calendarRange}
                  onChange={(e) => setCalendarRange(e.target.value as 'week' | 'month')}
                >
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                </select>
              ) : null}
              {viewType !== 'list' && viewType !== 'calendar' ? (
                <select
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  value={viewGroupField}
                  onChange={(e) => setViewGroupField(e.target.value)}
                >
                  <option value="">Group by field…</option>
                  {fields.map((f) => (
                    <option key={f.id} value={f.key}>
                      {f.label}
                    </option>
                  ))}
                </select>
              ) : null}
              <Button
                type="button"
                size="sm"
                disabled={pending || !viewName.trim()}
                onClick={() => {
                  setError(null)
                  startTransition(async () => {
                    try {
                      await createViewAction({
                        name: viewName.trim(),
                        type: viewType,
                        groupByField:
                          viewType === 'list' || viewType === 'calendar'
                            ? undefined
                            : viewGroupField || undefined,
                        calendarRange: viewType === 'calendar' ? calendarRange : undefined,
                        colorByField:
                          viewType === 'calendar'
                            ? fields.find((f) => f.type === 'entity' || f.type === 'select')?.key ??
                              null
                            : undefined,
                        filters: {},
                        visible: true,
                        position: views.length,
                        source: 'user',
                      })
                      setViewName('')
                      router.refresh()
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Failed to add view')
                    }
                  })
                }}
              >
                Add view
              </Button>
            </div>
            {views.length > 0 ? (
              <p className="mt-2 text-xs text-neutral-500">
                {views.length} saved view{views.length === 1 ? '' : 's'} in this workspace.
              </p>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  )
}
