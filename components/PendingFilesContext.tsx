'use client'

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import type { PendingApproval, SpaceFile } from '@/lib/types'

interface PendingFilesContextValue {
  pending: PendingApproval | null
  setPending: (batch: PendingApproval | null) => void
  approveForSpace: (slug: string, spaceName: string) => Promise<boolean>
  dismiss: () => void
  lastAddedSlug: string | null
}

const PendingFilesContext = createContext<PendingFilesContextValue | null>(null)

export function usePendingFiles() {
  const ctx = useContext(PendingFilesContext)
  if (!ctx) throw new Error('usePendingFiles must be used within PendingFilesProvider')
  return ctx
}

export function PendingFilesProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingApproval | null>(null)
  const [lastAddedSlug, setLastAddedSlug] = useState<string | null>(null)

  const approveForSpace = useCallback(
    async (slug: string, spaceName: string) => {
      if (!pending) return false

      const files: SpaceFile[] = pending.files.map((f) => ({
        name: f.name,
        path: f.path,
        isDirectory: f.type === 'directory',
        source: pending.label,
      }))

      const res = await fetch(`/api/spaces/${slug}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files, spaceName }),
      })

      if (!res.ok) return false

      setLastAddedSlug(slug)
      setPending(null)
      return true
    },
    [pending]
  )

  const dismiss = useCallback(() => setPending(null), [])

  return (
    <PendingFilesContext.Provider
      value={{ pending, setPending, approveForSpace, dismiss, lastAddedSlug }}
    >
      {children}
    </PendingFilesContext.Provider>
  )
}
