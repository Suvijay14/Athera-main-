'use client'

import { useEffect, useRef } from 'react'

import { logViewOpenedAction } from '@/app/workspace/actions'
import type { ViewDefinition } from '@/lib/db/schemas'

type ViewOpenedTrackerProps = {
  view: ViewDefinition
}

export function ViewOpenedTracker({ view }: ViewOpenedTrackerProps) {
  const loggedRef = useRef<string | null>(null)

  useEffect(() => {
    if (loggedRef.current === view.id) {
      return
    }
    loggedRef.current = view.id
    void logViewOpenedAction(view.id, view.type)
  }, [view.id, view.type])

  return null
}
