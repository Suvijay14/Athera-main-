'use client'

import { Badge } from '@/components/ctc/ui/Badge'
import { cn } from '@/lib/utils'
import { EntityChip } from '@/components/workspace/entity-chip'
import type { Entity, FieldDefinition } from '@/lib/db/schemas'
import {
  formatFieldReadDisplay,
  isEmptyFieldValue,
} from '@/lib/workspace/field-read-display'

export type FieldRendererProps = {
  field: FieldDefinition
  value: unknown
  mode: 'read' | 'edit'
  onChange?: (value: unknown) => void
  error?: string
  id?: string
  entitiesById?: Map<string, Entity>
  itemSpaceId?: string
}

const inputClass =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60'

export function FieldRenderer({
  field,
  value,
  mode,
  onChange,
  error,
  id,
  entitiesById,
  itemSpaceId,
}: FieldRendererProps) {
  const controlId = id ?? `field-${field.key}`
  const disabled = mode === 'edit' && !onChange

  if (mode === 'read') {
    if (isEmptyFieldValue(value)) {
      return <span className="text-neutral-400">—</span>
    }
    if (field.type === 'entity' && typeof value === 'string') {
      const ent = entitiesById?.get(value)
      if (ent) {
        return (
          <EntityChip
            entityId={ent.id}
            label={ent.name}
            spaceId={ent.spaceId}
            color={ent.color}
          />
        )
      }
    }
    if (field.type === 'select') {
      return (
        <Badge variant="outline" className="font-normal">
          {formatFieldReadDisplay(field, value)}
        </Badge>
      )
    }
    const text = formatFieldReadDisplay(field, value)
    const align = field.type === 'number' ? 'block text-right tabular-nums' : ''
    return (
      <span className={`text-neutral-800 ${align}`.trim()} aria-label={field.type === 'checkbox' ? (value === true ? 'Yes' : 'No') : undefined}>
        {text}
      </span>
    )
  }

  switch (field.type) {
    case 'text':
      return (
        <div>
          <input
            id={controlId}
            type="text"
            className={cn(inputClass, error && 'border-red-500')}
            value={isEmptyFieldValue(value) ? '' : String(value)}
            disabled={disabled}
            onChange={(e) => onChange?.(e.target.value)}
          />
          {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
        </div>
      )
    case 'number':
      return (
        <div>
          <input
            id={controlId}
            type="number"
            className={cn(inputClass, 'text-right tabular-nums', error && 'border-red-500')}
            value={isEmptyFieldValue(value) ? '' : Number(value)}
            disabled={disabled}
            onChange={(e) =>
              onChange?.(e.target.value === '' ? null : Number(e.target.value))
            }
          />
          {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
        </div>
      )
    case 'date':
      return (
        <div>
          <input
            id={controlId}
            type="date"
            className={cn(inputClass, error && 'border-red-500')}
            value={isEmptyFieldValue(value) ? '' : String(value)}
            disabled={disabled}
            onChange={(e) => onChange?.(e.target.value || null)}
          />
          {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
        </div>
      )
    case 'select':
      return (
        <div>
          <select
            id={controlId}
            className={cn(inputClass, error && 'border-red-500')}
            value={isEmptyFieldValue(value) ? '' : String(value)}
            disabled={disabled}
            onChange={(e) => onChange?.(e.target.value || null)}
          >
            <option value="">—</option>
            {field.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
        </div>
      )
    case 'checkbox':
      return (
        <div className="flex items-center gap-2">
          <input
            id={controlId}
            type="checkbox"
            className="h-4 w-4 rounded border-neutral-300 focus-visible:ring-2 focus-visible:ring-primary"
            checked={value === true}
            disabled={disabled}
            onChange={(e) => onChange?.(e.target.checked)}
          />
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
        </div>
      )
    case 'entity': {
      const ent =
        typeof value === 'string' && entitiesById ? entitiesById.get(value) : undefined
      if (ent && itemSpaceId) {
        return (
          <EntityChip
            entityId={ent.id}
            label={ent.name}
            spaceId={itemSpaceId}
            color={ent.color}
            onRemove={onChange ? () => onChange(null) : undefined}
          />
        )
      }
      return (
        <div>
          <input
            id={controlId}
            type="text"
            className={cn(inputClass, 'font-mono text-xs', error && 'border-red-500')}
            value={isEmptyFieldValue(value) ? '' : String(value)}
            disabled={disabled}
            placeholder="Entity id"
            onChange={(e) => onChange?.(e.target.value.trim() || null)}
          />
          {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
        </div>
      )
    }
    default:
      return null
  }
}
