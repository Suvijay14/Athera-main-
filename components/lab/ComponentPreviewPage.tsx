'use client'

import Link from 'next/link'
import { useState } from 'react'

import { LabWrapper } from '@/lib/components/adapters/LabWrapper'
import { getComponentMeta, isComponentId, isLiveComponent } from '@/lib/components/registry-meta'
import { renderComponent } from '@/lib/components/component-renderers'
import { useComponentLab } from '@/lib/hooks/useComponentLab'

export default function ComponentPreviewPage({ id }: { id: string }) {
  const validId = isComponentId(id) ? id : null
  const meta = validId ? getComponentMeta(validId) : undefined
  const { isApproved, approve, unapprove } = useComponentLab()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  if (!validId || !meta) {
    return (
      <div className="p-8">
        <p className="text-error">Unknown component id.</p>
        <Link href="/components" className="text-primary underline mt-2 inline-block">
          Back to lab
        </Link>
      </div>
    )
  }

  const live = isLiveComponent(validId)

  async function toggle() {
    if (!live) return
    setBusy(true)
    setErr(null)
    try {
      if (isApproved(validId!)) await unapprove(validId!)
      else await approve(validId!)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/components" className="text-body-sm text-secondary hover:text-primary">
          ← Component lab
        </Link>
        <h1 className="font-jakarta text-headline-lg text-on-surface flex-1">{meta.title}</h1>
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            live ? 'bg-primary/15 text-primary' : 'bg-surface-container text-secondary'
          }`}
        >
          {live ? 'Live — interactive' : 'Planned — preview only'}
        </span>
        <button
          type="button"
          disabled={busy || !live}
          title={live ? undefined : 'Approve when this component is ported to live'}
          onClick={toggle}
          className="px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy ? '…' : isApproved(validId) ? 'Revoke approval' : 'Approve'}
        </button>
      </div>
      {err && <p className="text-error text-sm">{err}</p>}
      <LabWrapper title={meta.title}>{renderComponent(validId, { space: 'school' })}</LabWrapper>
    </div>
  )
}
