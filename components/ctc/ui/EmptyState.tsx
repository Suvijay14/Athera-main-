'use client'

import type { LucideIcon } from 'lucide-react'

import FadeIn from '@/components/ctc/ui/FadeIn'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <FadeIn direction="scale">
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-surface-container border border-border-serenity mb-4">
          <Icon size={28} className="text-primary" />
        </div>
        <h3 className="font-jakarta text-headline-md text-on-surface mb-2">{title}</h3>
        <p className="text-body-sm text-secondary max-w-sm mb-6">{description}</p>
        {(action || secondaryAction) && (
          <div className="flex items-center gap-3 flex-wrap justify-center">
            {action && (
              <button
                type="button"
                onClick={action.onClick}
                className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-medium hover:opacity-90"
              >
                {action.label}
              </button>
            )}
            {secondaryAction && (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="px-4 py-2 text-sm text-secondary hover:text-on-surface"
              >
                {secondaryAction.label}
              </button>
            )}
          </div>
        )}
      </div>
    </FadeIn>
  )
}
