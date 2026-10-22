'use client'

import clsx from 'clsx'

export default function NotesPage({
  typedText,
  showCursor,
  className = '',
}: {
  typedText: string
  showCursor?: boolean
  className?: string
}) {
  return (
    <div className={clsx('rounded-lg border border-border-delicate bg-surface-paper p-3', className)}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted mb-2">Notes</p>
      <p className="text-sm text-ink-primary leading-relaxed font-mono whitespace-pre-wrap min-h-[3rem]">
        {typedText}
        {showCursor ? (
          <span className="inline-block w-0.5 h-4 ml-0.5 bg-terracotta align-middle animate-pulse" />
        ) : null}
      </p>
      <p className="mt-2 text-[11px] text-ink-muted">
        Type <span className="font-mono text-ink-secondary">[] task name</span> to turn a line into
        work on the timeline.
      </p>
    </div>
  )
}
