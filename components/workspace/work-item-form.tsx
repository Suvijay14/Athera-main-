'use client'

import { useState, useTransition } from 'react'

import { Button } from '@/components/ctc/ui/Button'
import { FieldRenderer } from '@/components/workspace/field-renderer'
import type { FieldDefinition, WorkItem } from '@/lib/db/schemas'
import { validateWorkItemForm, type WorkItemFormValues } from '@/lib/workspace/form-payload'

export type WorkItemFormSubmitData = WorkItemFormValues

type WorkItemFormProps = {
  fields: FieldDefinition[]
  initialValue?: Partial<WorkItem>
  onSubmit: (data: WorkItemFormSubmitData) => Promise<void>
  onCancel?: () => void
  autoFocus?: boolean
}

export function WorkItemForm({
  fields,
  initialValue,
  onSubmit,
  onCancel,
  autoFocus = false,
}: WorkItemFormProps) {
  const [title, setTitle] = useState(initialValue?.title ?? '')
  const [dueDate, setDueDate] = useState<string | null>(initialValue?.dueDate ?? null)
  const [notes, setNotes] = useState(initialValue?.notes ?? '')
  const [data, setData] = useState<Record<string, unknown>>(initialValue?.data ?? {})
  const [titleError, setTitleError] = useState<string | undefined>()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [bannerError, setBannerError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const visibleFields = fields.filter((f) => f.visible).sort((a, b) => a.position - b.position)

  function setFieldValue(key: string, value: unknown) {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBannerError(null)
    const result = validateWorkItemForm(fields, {
      title,
      dueDate,
      notes: notes.trim() ? notes : null,
      data,
    })
    if (!result.ok) {
      setTitleError(result.titleError)
      const map: Record<string, string> = {}
      for (const err of result.fieldErrors) {
        map[err.key] = err.message
      }
      setFieldErrors(map)
      return
    }
    setTitleError(undefined)
    setFieldErrors({})
    startTransition(async () => {
      try {
        await onSubmit(result.payload)
      } catch (err) {
        setBannerError(err instanceof Error ? err.message : 'Something went wrong')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
      {bannerError ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {bannerError}
        </p>
      ) : null}
      <div>
        <label htmlFor="work-item-title" className="block text-sm font-medium text-neutral-800">
          Title
        </label>
        <input
          id="work-item-title"
          autoFocus={autoFocus}
          required
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        {titleError ? <p className="mt-1 text-xs text-red-600">{titleError}</p> : null}
      </div>
      <div>
        <label htmlFor="work-item-due" className="block text-sm font-medium text-neutral-800">
          Due date
        </label>
        <input
          id="work-item-due"
          type="date"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          value={dueDate ?? ''}
          onChange={(e) => setDueDate(e.target.value || null)}
        />
      </div>
      {visibleFields.map((field) => (
        <div key={field.id}>
          <label htmlFor={`work-item-${field.key}`} className="mb-1 block text-sm font-medium text-neutral-800">
            {field.label}
          </label>
          <FieldRenderer
            id={`work-item-${field.key}`}
            field={field}
            mode="edit"
            value={data[field.key]}
            onChange={(v) => setFieldValue(field.key, v)}
            error={fieldErrors[field.key]}
          />
        </div>
      ))}
      <div>
        <label htmlFor="work-item-notes" className="block text-sm font-medium text-neutral-800">
          Notes
        </label>
        <textarea
          id="work-item-notes"
          rows={3}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : initialValue?.id ? 'Save changes' : 'Create'}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  )
}
