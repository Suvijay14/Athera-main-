'use client'

import { useState } from 'react'
import ThinkOutLoud from '@/components/ThinkOutLoud'

export default function CompactAssistant({ space = 'school' }: { space?: string }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <section className="card-v2 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-surface-container-low/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-fixed/40 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[20px]">psychology</span>
          </div>
          <div>
            <span className="font-jakarta text-label-lg text-on-surface block">Think out loud</span>
            <span className="text-body-sm text-secondary">
              Workspace commands + Ollama/Groq assistant (sidebar Voice uses the same stack)
            </span>
          </div>
        </div>
        <span className="material-symbols-outlined text-secondary">
          {expanded ? 'expand_less' : 'expand_more'}
        </span>
      </button>
      {expanded && (
        <div className="px-2 pb-2 border-t border-border-serenity/60">
          <ThinkOutLoud space={space} />
        </div>
      )}
    </section>
  )
}
