'use client'

import { Inbox } from 'lucide-react'

import EmptyState from '@/components/ctc/ui/EmptyState'

export default function EmptyStateDemo() {
  return (
    <EmptyState
      icon={Inbox}
      title="Nothing here yet"
      description="Ported empty state from Cut the Chaos, styled for Contextual Serenity."
      action={{ label: 'Add item', onClick: () => {} }}
      secondaryAction={{ label: 'Learn more', onClick: () => {} }}
    />
  )
}
