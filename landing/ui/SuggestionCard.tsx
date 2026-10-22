'use client'

import clsx from 'clsx'
import { forwardRef } from 'react'

type SuggestionCardProps = {
  message: string
  primaryLabel: string
  secondaryLabel?: string
  primaryPressed?: boolean
  className?: string
}

const SuggestionCard = forwardRef<HTMLButtonElement, SuggestionCardProps>(function SuggestionCard(
  { message, primaryLabel, secondaryLabel = 'Not now', primaryPressed, className },
  ref
) {
  return (
    <div
      className={clsx(
        'landing-card border-l-4 border-l-terracotta px-3 py-2.5',
        className
      )}
    >
      <p className="text-sm text-ink-secondary leading-snug">{message}</p>
      <div className="mt-2 flex flex-wrap gap-2 items-center">
        <button
          ref={ref}
          type="button"
          tabIndex={-1}
          className={clsx(
            'h-9 px-3 text-xs font-semibold text-white rounded-md transition-transform',
            primaryPressed ? 'scale-95 bg-terracotta-soft' : 'bg-terracotta'
          )}
        >
          {primaryLabel}
        </button>
        <span className="h-9 inline-flex items-center text-xs text-ink-secondary px-1">
          {secondaryLabel}
        </span>
      </div>
    </div>
  )
})

export default SuggestionCard
