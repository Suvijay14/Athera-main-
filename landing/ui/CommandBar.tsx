'use client'

export const ATHERA_COMMAND_PLACEHOLDER = 'Search or add a task…'

export default function CommandBar({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border border-border-delicate bg-surface-container/40 px-2.5 py-2 text-[11px] text-ink-muted ${className}`}
    >
      <span className="flex-1 min-w-0 truncate">{ATHERA_COMMAND_PLACEHOLDER}</span>
      <kbd className="shrink-0 text-[9px] font-medium text-ink-faint border border-border-delicate rounded px-1 py-0.5">
        ⌘K
      </kbd>
    </div>
  )
}
