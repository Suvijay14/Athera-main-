'use client'

import { format, parseISO } from 'date-fns'
import { X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { deleteWorkItemAction, updateWorkItemAction } from '@/app/workspace/actions'
import {
  completeRecurringItemAction,
  deleteRecurringInstanceAction,
  saveRecurringItemEditAction,
} from '@/app/workspace/recurrence-actions'
import { Button } from '@/components/ctc/ui/Button'
import { FieldRenderer } from '@/components/workspace/field-renderer'
import { useWorkspaceUi } from '@/components/workspace/workspace-ui-context'
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue'
import type { Entity, FieldDefinition, RecurrenceRule, Space } from '@/lib/db/schemas'
import { validateWorkItemForm } from '@/lib/workspace/form-payload'
import type { DisplayWorkItem } from '@/lib/workspace/merge-recurrence-display-items'
import { formatRecurrenceLabel } from '@/lib/workspace/recurrence'
import { parseVirtualRecurrenceId } from '@/lib/workspace/recurrence-types'

type ItemDetailPanelProps = {
  item: DisplayWorkItem
  fields: FieldDefinition[]
  spaces: Space[]
  defaultSpace: Space
  entities: Entity[]
  recurrenceRules: RecurrenceRule[]
  itemLabel: string
  onClose: () => void
  layout: 'sheet' | 'sidebar'
}

type RecurrenceScope = 'this_one' | 'all_future'

const AUTOSAVE_MS = 450

function toLocalDatetimeValue(iso: string | null): string {
  if (!iso) {
    return ''
  }
  try {
    const d = parseISO(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return ''
  }
}

function fromLocalDatetimeValue(value: string): string | null {
  if (!value) {
    return null
  }
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) {
    return null
  }
  return d.toISOString()
}

export function ItemDetailPanel({
  item,
  fields,
  spaces,
  defaultSpace,
  entities,
  recurrenceRules,
  itemLabel,
  onClose,
  layout,
}: ItemDetailPanelProps) {
  void defaultSpace
  const entitiesById = new Map(entities.map((e) => [e.id, e]))
  const router = useRouter()
  const { showActivityToast } = useWorkspaceUi()
  const [, startTransition] = useTransition()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [recurrenceScopePrompt, setRecurrenceScopePrompt] = useState<{
    patch: Parameters<typeof saveRecurringItemEditAction>[0]['patch']
  } | null>(null)
  const [title, setTitle] = useState(item.title)
  const [dueDate, setDueDate] = useState<string | null>(item.dueDate)
  const [startLocal, setStartLocal] = useState(toLocalDatetimeValue(item.startAt))
  const [endLocal, setEndLocal] = useState(toLocalDatetimeValue(item.endAt))
  const [notes, setNotes] = useState(item.notes ?? '')
  const [data, setData] = useState<Record<string, unknown>>(item.data)
  const [spaceId, setSpaceId] = useState(item.spaceId)
  const itemIdRef = useRef(item.id)
  const savingRef = useRef(false)
  const skipAutosaveRef = useRef(true)

  const usesScheduledTime = Boolean(item.startAt) || Boolean(startLocal)
  const recurrenceId =
    item.recurrenceId ??
    parseVirtualRecurrenceId(item.id)?.recurrenceId ??
    null
  const recurrenceRule = recurrenceId
    ? recurrenceRules.find((r) => r.id === recurrenceId)
    : undefined
  const isRecurring = Boolean(recurrenceId)

  useEffect(() => {
    itemIdRef.current = item.id
    setTitle(item.title)
    setDueDate(item.dueDate)
    setStartLocal(toLocalDatetimeValue(item.startAt))
    setEndLocal(toLocalDatetimeValue(item.endAt))
    setNotes(item.notes ?? '')
    setData(item.data)
    setSpaceId(item.spaceId)
    setSaveError(null)
    skipAutosaveRef.current = true
  }, [item])

  const debouncedTitle = useDebouncedValue(title, AUTOSAVE_MS)
  const debouncedDueDate = useDebouncedValue(dueDate, AUTOSAVE_MS)
  const debouncedStart = useDebouncedValue(startLocal, AUTOSAVE_MS)
  const debouncedEnd = useDebouncedValue(endLocal, AUTOSAVE_MS)
  const debouncedNotes = useDebouncedValue(notes, AUTOSAVE_MS)
  const debouncedData = useDebouncedValue(data, AUTOSAVE_MS)

  const persist = useCallback(
    (patch: {
      title: string
      dueDate: string | null
      notes: string | null
      data: Record<string, unknown>
      startAt: string | null
      endAt: string | null
    }) => {
      const validation = validateWorkItemForm(fields, {
        title: patch.title,
        dueDate: patch.dueDate,
        notes: patch.notes,
        data: patch.data,
      })
      if (!validation.ok) {
        setSaveError(validation.titleError ?? validation.fieldErrors[0]?.message ?? 'Invalid')
        return
      }
      if (savingRef.current) {
        return
      }
      savingRef.current = true
      setSaveError(null)
      startTransition(async () => {
        try {
          const payload = {
            title: validation.payload.title,
            dueDate: usesScheduledTime ? null : validation.payload.dueDate,
            notes: validation.payload.notes,
            data: validation.payload.data,
            startAt: usesScheduledTime ? patch.startAt : null,
            endAt: usesScheduledTime ? patch.endAt : null,
            allDay: false,
          }
          if (isRecurring) {
            setRecurrenceScopePrompt({ patch: payload })
            savingRef.current = false
            return
          }
          const result = await updateWorkItemAction(itemIdRef.current, payload)
          if (result.reactivatedEntityName) {
            showActivityToast(`${result.reactivatedEntityName} is active again`)
          }
          router.refresh()
        } catch (err) {
          setSaveError(err instanceof Error ? err.message : 'Could not save')
        } finally {
          savingRef.current = false
        }
      })
    },
    [fields, isRecurring, router, showActivityToast, startTransition, usesScheduledTime]
  )

  async function applyRecurrenceScope(scope: RecurrenceScope) {
    if (!recurrenceScopePrompt) {
      return
    }
    const result = await saveRecurringItemEditAction({
      itemId: itemIdRef.current,
      scope,
      patch: recurrenceScopePrompt.patch,
    })
    setRecurrenceScopePrompt(null)
    if (!result.ok) {
      setSaveError(result.message)
      return
    }
    router.refresh()
  }

  useEffect(() => {
    if (skipAutosaveRef.current) {
      skipAutosaveRef.current = false
      return
    }
    persist({
      title: debouncedTitle,
      dueDate: debouncedDueDate,
      notes: debouncedNotes.trim() ? debouncedNotes : null,
      data: debouncedData,
      startAt: fromLocalDatetimeValue(debouncedStart),
      endAt: fromLocalDatetimeValue(debouncedEnd),
    })
  }, [
    debouncedTitle,
    debouncedDueDate,
    debouncedNotes,
    debouncedData,
    debouncedStart,
    debouncedEnd,
    persist,
  ])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const visibleFields = fields.filter((f) => f.visible).sort((a, b) => a.position - b.position)

  const panelClass =
    layout === 'sheet'
      ? 'fixed inset-0 z-50 flex flex-col bg-white md:hidden'
      : 'hidden md:flex md:h-[calc(100vh-8rem)] md:w-[400px] md:shrink-0 md:flex-col md:border-l md:border-neutral-200 md:bg-white'

  return (
    <>
      {layout === 'sheet' ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-neutral-900/30 md:hidden"
          aria-label="Close panel"
          onClick={onClose}
        />
      ) : null}
      <aside className={panelClass} aria-label={`${itemLabel} details`}>
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-neutral-900">Details</h2>
          <button
            type="button"
            className="rounded-lg p-1 text-neutral-600 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {saveError ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-800" role="alert">
              {saveError}
            </p>
          ) : null}
          <div>
            <label htmlFor="detail-title" className="block text-xs font-medium text-neutral-600">
              Title
            </label>
            <input
              id="detail-title"
              className="mt-1 w-full border-0 border-b border-neutral-200 bg-transparent px-0 py-2 text-lg font-medium text-neutral-900 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-0"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <span className="block text-xs font-medium text-neutral-600">
              {usesScheduledTime ? 'Start & end' : 'Due date'}
            </span>
            {usesScheduledTime ? (
              <div className="mt-2 grid gap-2">
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  value={startLocal}
                  onChange={(e) => setStartLocal(e.target.value)}
                />
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  value={endLocal}
                  onChange={(e) => setEndLocal(e.target.value)}
                />
              </div>
            ) : (
              <input
                type="date"
                className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                value={dueDate ?? ''}
                onChange={(e) => setDueDate(e.target.value || null)}
              />
            )}
          </div>

          <div>
            <label htmlFor="detail-space" className="block text-xs font-medium text-neutral-600">
              Space
            </label>
            <select
              id="detail-space"
              className="mt-2 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
              value={spaceId}
              onChange={(e) => {
                const next = e.target.value
                setSpaceId(next)
                startTransition(async () => {
                  try {
                    await updateWorkItemAction(itemIdRef.current, { spaceId: next })
                    router.refresh()
                  } catch (err) {
                    setSaveError(err instanceof Error ? err.message : 'Could not move space')
                    setSpaceId(item.spaceId)
                  }
                })
              }}
            >
              {spaces
                .filter((s) => !s.archivedAt)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>

          {visibleFields.map((field) => (
            <div key={field.id}>
              <label className="mb-1 block text-xs font-medium text-neutral-600">{field.label}</label>
              <FieldRenderer
                field={field}
                mode="edit"
                value={data[field.key]}
                entitiesById={entitiesById}
                itemSpaceId={item.spaceId}
                onChange={(v) => setData((prev) => ({ ...prev, [field.key]: v }))}
              />
            </div>
          ))}

          <div>
            <label htmlFor="detail-notes" className="block text-xs font-medium text-neutral-600">
              Notes
            </label>
            <textarea
              id="detail-notes"
              rows={4}
              className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div>
            <span className="block text-xs font-medium text-neutral-600">Repeats</span>
            <p className="mt-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
              {recurrenceRule ? formatRecurrenceLabel(recurrenceRule) : 'Not set'}
            </p>
          </div>
          {recurrenceScopePrompt ? (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
              <p className="font-medium">Apply this change to</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={() => void applyRecurrenceScope('this_one')}>
                  This one
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void applyRecurrenceScope('all_future')}
                >
                  All future
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setRecurrenceScopePrompt(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}

          <div>
            <span className="block text-xs font-medium text-neutral-600">Activity</span>
            <ul className="mt-2 space-y-1 text-xs text-neutral-600">
              <li>Created {format(parseISO(item.createdAt), 'MMM d, yyyy · h:mm a')}</li>
              <li>Updated {format(parseISO(item.updatedAt), 'MMM d, yyyy · h:mm a')}</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-200 px-4 py-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={Boolean(item.completedAt)}
            onClick={() => {
              startTransition(async () => {
                if (isRecurring) {
                  await completeRecurringItemAction(item.id)
                }
                router.refresh()
              })
            }}
          >
            Complete
          </Button>
          <Button type="button" variant="outline" size="sm" disabled title="Archive — needs schema decision">
            Archive
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-red-700"
            onClick={() => {
              if (window.confirm(`Delete this ${itemLabel.toLowerCase()}? This cannot be undone.`)) {
                startTransition(async () => {
                  if (isRecurring) {
                    await deleteRecurringInstanceAction(item.id)
                  } else {
                    await deleteWorkItemAction(item.id)
                  }
                  onClose()
                  router.refresh()
                })
              }
            }}
          >
            Delete
          </Button>
        </div>
      </aside>
    </>
  )
}

export function ItemDetailPanelHost({
  items,
  fields,
  entities,
  spaces,
  defaultSpace,
  itemLabel,
  recurrenceRules,
}: {
  items: DisplayWorkItem[]
  fields: FieldDefinition[]
  entities: Entity[]
  spaces: Space[]
  defaultSpace: Space
  itemLabel: string
  recurrenceRules: RecurrenceRule[]
}) {
  const { selectedItemId, closeItem } = useWorkspaceUi()
  const item = items.find((i) => i.id === selectedItemId)
  if (!item) {
    return null
  }
  const itemSpace = spaces.find((s) => s.id === item.spaceId) ?? defaultSpace
  return (
    <>
      <ItemDetailPanel
        item={item}
        fields={fields}
        spaces={spaces}
        defaultSpace={itemSpace}
        entities={entities}
        recurrenceRules={recurrenceRules}
        itemLabel={itemLabel}
        onClose={closeItem}
        layout="sidebar"
      />
      <ItemDetailPanel
        item={item}
        fields={fields}
        spaces={spaces}
        defaultSpace={itemSpace}
        entities={entities}
        recurrenceRules={recurrenceRules}
        itemLabel={itemLabel}
        onClose={closeItem}
        layout="sheet"
      />
    </>
  )
}
