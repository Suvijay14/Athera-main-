'use client'

import { Copy, Mail } from 'lucide-react'

export default function DraftCard({ body }: { body: string }) {
  return (
    <div className="landing-card px-3 py-3 space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
        Draft message
      </p>
      <p className="text-sm text-ink-primary leading-relaxed">{body}</p>
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 h-8 px-2.5 text-[11px] font-semibold rounded-md border border-border-delicate text-ink-secondary">
          <Copy className="w-3.5 h-3.5" aria-hidden />
          Copy
        </span>
        <span className="inline-flex items-center gap-1 h-8 px-2.5 text-[11px] font-semibold rounded-md border border-sage/40 text-sage bg-sage-light/30">
          <Mail className="w-3.5 h-3.5" aria-hidden />
          Open in email
        </span>
      </div>
    </div>
  )
}
