'use client'

import type { ComponentDefinitionMeta } from '@/lib/components/types'

export default function PlannedPortPlaceholder({ meta }: { meta: ComponentDefinitionMeta }) {
  return (
    <div className="rounded-xl border border-dashed border-border-serenity bg-surface-container-low p-6 space-y-3">
      <p className="text-body-sm text-secondary">
        This Cut the Chaos component is registered in the lab but not ported yet.
      </p>
      {meta.portWave && (
        <p className="text-body-sm text-on-surface">
          Target wave: <span className="font-medium">{meta.portWave}</span>
        </p>
      )}
      {meta.ctcOriginPath && (
        <p className="text-body-sm text-secondary font-mono text-xs break-all">{meta.ctcOriginPath}</p>
      )}
      <p className="text-body-sm text-secondary">
        Approve is disabled until status is <strong className="text-on-surface">live</strong>. Use Preview
        on live demos (UI kit, toast, native widgets) to test the approval → dashboard flow today.
      </p>
    </div>
  )
}
