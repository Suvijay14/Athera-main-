'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'

import { undoLatestChangeAction } from '@/app/workspace/suggestion-actions'
import { Button } from '@/components/ctc/ui/Button'
import type { ChangeLogListItem } from '@/lib/db/change-log'

export function ChangeHistoryList({ entries }: { entries: ChangeLogListItem[] }) {
  const router = useRouter()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [errorById, setErrorById] = useState<Record<string, string>>({})

  async function handleUndo(id: string) {
    setPendingId(id)
    setErrorById((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    const result = await undoLatestChangeAction(id)
    setPendingId(null)
    if (!result.ok) {
      setErrorById((prev) => ({ ...prev, [id]: result.message }))
      return
    }
    router.refresh()
  }

  if (entries.length === 0) {
    return (
      <p className="text-sm text-on-surface-variant">Athera hasn&apos;t changed anything yet.</p>
    )
  }

  return (
    <ul className="space-y-4">
      {entries.map((entry) => {
        const undone = entry.undoneAt !== null
        return (
          <li
            key={entry.id}
            className="rounded-xl border border-border-serenity bg-surface-container-lowest p-4"
          >
            <p className="text-sm font-medium text-on-surface">{entry.suggestionReason}</p>
            <p className="mt-1 text-xs text-on-surface-variant">
              {entry.suggestionType.replace(/-/g, ' ')} ·{' '}
              {format(parseISO(entry.appliedAt), 'MMM d, yyyy h:mm a')}
            </p>
            {errorById[entry.id] ? (
              <p className="mt-2 text-sm text-error" role="alert">
                {errorById[entry.id]}
              </p>
            ) : null}
            <div className="mt-3">
              {undone ? (
                <span className="text-xs font-medium text-on-surface-variant">Undone</span>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pendingId === entry.id}
                  onClick={() => void handleUndo(entry.id)}
                >
                  {pendingId === entry.id ? 'Undoing…' : 'Undo'}
                </Button>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
