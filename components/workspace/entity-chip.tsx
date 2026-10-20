'use client'

import Link from 'next/link'
import { X } from 'lucide-react'

import { spaceEntityHref } from '@/lib/workspace/home-route'

type EntityChipProps = {
  entityId: string
  label: string
  spaceId: string
  color?: string | null
  onRemove?: () => void
}

export function EntityChip({ entityId, label, spaceId, color, onRemove }: EntityChipProps) {
  return (
    <span
      className="inline-flex max-w-full items-center gap-1 rounded-full py-0.5 pl-2.5 pr-1 text-xs font-medium text-white"
      style={{ backgroundColor: color ?? '#6366f1' }}
    >
      <Link
        href={spaceEntityHref(spaceId, entityId)}
        className="truncate hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
      >
        {label}
      </Link>
      {onRemove ? (
        <button
          type="button"
          className="rounded-full p-0.5 hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          aria-label={`Remove ${label}`}
          onClick={(e) => {
            e.preventDefault()
            onRemove()
          }}
        >
          <X size={12} />
        </button>
      ) : null}
    </span>
  )
}
