'use client'

import { useState } from 'react'

import FadeIn from '@/components/ctc/ui/FadeIn'

export default function PageTransitionDemo() {
  const [key, setKey] = useState(0)

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setKey((k) => k + 1)}
        className="px-3 py-1.5 rounded-xl bg-surface-container text-sm"
      >
        Replay transition
      </button>
      <FadeIn key={key} direction="up">
        <div className="rounded-xl border border-border-serenity p-6 bg-surface-container-low">
          <p className="text-on-surface font-medium">Content enters with CTC FadeIn</p>
          <p className="text-body-sm text-secondary mt-2">Use on dashboard sections after navigation.</p>
        </div>
      </FadeIn>
    </div>
  )
}
