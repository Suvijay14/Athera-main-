import type { FieldDefinition } from '@/lib/db/schemas'
import { validateItemData } from '@/lib/db/validate-item-data'

export type WorkItemFormValues = {
  title: string
  dueDate: string | null
  notes: string | null
  data: Record<string, unknown>
}

export type FormValidationResult =
  | { ok: true; payload: WorkItemFormValues }
  | { ok: false; titleError?: string; fieldErrors: { key: string; message: string }[] }

export function validateWorkItemForm(
  fields: FieldDefinition[],
  values: WorkItemFormValues
): FormValidationResult {
  const title = values.title.trim()
  if (!title) {
    return { ok: false, titleError: 'Title is required', fieldErrors: [] }
  }

  const visibleFields = fields.filter((f) => f.visible)
  const dataResult = validateItemData(values.data, visibleFields)
  if (!dataResult.ok) {
    return { ok: false, fieldErrors: dataResult.errors }
  }

  return {
    ok: true,
    payload: {
      title,
      dueDate: values.dueDate,
      notes: values.notes,
      data: dataResult.data,
    },
  }
}
