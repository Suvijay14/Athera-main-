'use client'

import { useState } from 'react'

export default function SuggestedNextAction({
  note,
  loading,
}: {
  note: string
  loading?: boolean
}) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || loading) return null
  if (!note?.trim()) return null

  const text = note.replace(/^["']|["']$/g, '').trim()

  return (
    <section className="rounded-2xl bg-secondary-container/80 border border-secondary-fixed-dim/40 p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center text-primary shadow-serenity shrink-0">
          <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
        </div>
        <div className="min-w-0">
          <span className="label-caps text-[10px] text-on-secondary-container block mb-1">
            Suggested next · From Athera&apos;s Note
          </span>
          <p className="font-jakarta text-headline-md text-primary leading-snug">{text}</p>
          <p className="text-body-sm text-secondary mt-1">
            Pulled from your connected note API — not a separate recommendation engine.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-body-sm text-secondary hover:text-on-surface px-3 py-2 rounded-full"
        >
          Not now
        </button>
        <button type="button" className="btn-primary text-sm whitespace-nowrap">
          Review →
        </button>
      </div>
    </section>
  )
}
