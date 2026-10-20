'use client'

import { getComponentMeta } from '@/lib/components/registry-meta'
import { renderComponent } from '@/lib/components/component-renderers'
import type { ComponentId, DashboardWidgetRow } from '@/lib/components/types'

export default function DashboardDynamicWidgets({
  widgets,
  onRemove,
  space = 'school',
}: {
  widgets: DashboardWidgetRow[]
  onRemove: (id: ComponentId) => void
  space?: string
}) {
  if (widgets.length === 0) {
    return (
      <p className="text-body-sm text-secondary card-v2 p-5">
        No dashboard widgets yet. Use <strong>+ Add component</strong> after approving items in the
        lab.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {widgets.map((row) => {
        const meta = getComponentMeta(row.componentId)
        const colSpan = meta?.defaultLayout?.colSpan === 2 ? 'lg:col-span-2' : ''
        return (
          <div key={row.componentId} className={`card-v2 p-5 relative group ${colSpan}`}>
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="font-jakarta text-headline-md text-on-surface">
                {meta?.title ?? row.componentId}
              </h2>
              <button
                type="button"
                onClick={() => onRemove(row.componentId)}
                className="opacity-0 group-hover:opacity-100 text-xs text-secondary hover:text-error px-2 py-1 rounded-lg hover:bg-surface-container transition-opacity"
                title="Remove from dashboard"
              >
                Remove
              </button>
            </div>
            {renderComponent(row.componentId, { space })}
          </div>
        )
      })}
    </div>
  )
}
