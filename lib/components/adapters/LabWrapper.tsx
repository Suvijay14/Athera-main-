'use client'

import type { ReactNode } from 'react'

export function LabWrapper({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border-serenity bg-surface-container-low px-4 py-2 text-body-sm text-secondary flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px] text-primary">science</span>
        <span>
          Lab preview — <span className="text-on-surface font-medium">{title}</span>
        </span>
      </div>
      <div className="card-v2 p-4 md:p-6">{children}</div>
    </div>
  )
}
