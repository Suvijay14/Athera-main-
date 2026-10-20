'use client'

import { getComponentMeta, isLiveComponent } from '@/lib/components/registry-meta'
import type { ComponentId } from '@/lib/components/types'

export default function AddDashboardWidgetModal({
  open,
  onClose,
  approvedIds,
  onLayoutIds,
  onAdd,
}: {
  open: boolean
  onClose: () => void
  approvedIds: ComponentId[]
  onLayoutIds: ComponentId[]
  onAdd: (id: ComponentId) => void
}) {
  if (!open) return null

  const candidates = approvedIds.filter((id) => {
    if (!isLiveComponent(id)) return false
    const meta = getComponentMeta(id)
    if (!meta?.surfaces.includes('dashboard')) return false
    return !onLayoutIds.includes(id)
  })

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-inverse-surface/40"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative card-v2 w-full max-w-md p-5 shadow-serenity-lg space-y-4">
        <h2 className="font-jakarta text-headline-md text-on-surface">Add dashboard component</h2>
        <p className="text-body-sm text-secondary">
          Only components you approved in the lab appear here.
        </p>
        {candidates.length === 0 ? (
          <p className="text-body-sm text-secondary py-4">
            No approved dashboard widgets left. Approve components at{' '}
            <a href="/components" className="text-primary underline">
              /components
            </a>
            .
          </p>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {candidates.map((id) => {
              const meta = getComponentMeta(id)
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => {
                      onAdd(id)
                      onClose()
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-surface-container border border-border-serenity"
                  >
                    <div className="font-medium text-on-surface text-sm">{meta?.title ?? id}</div>
                    <div className="text-xs text-secondary mt-0.5">{meta?.description}</div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 rounded-xl text-sm text-secondary hover:bg-surface-container"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
