'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

import {
  acceptSuggestionAction,
  dismissSuggestionAction,
  markShownAction,
} from '@/app/workspace/suggestion-actions'
import { AdaptationToast, type ActiveAdaptationToast } from '@/components/adaptation/adaptation-toast'
import { shouldMarkSuggestionShown } from '@/lib/adaptation/suggestion-ui'
import type { Suggestion } from '@/lib/db/schemas'

type CalendarViewSuggestionCardProps = {
  suggestion: Suggestion
}

export function CalendarViewSuggestionCard({ suggestion: initial }: CalendarViewSuggestionCardProps) {
  const router = useRouter()
  const [suggestion, setSuggestion] = useState<Suggestion | null>(initial)
  const [busy, setBusy] = useState<'accept' | 'dismiss' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<ActiveAdaptationToast | null>(null)
  const markedShownRef = useRef<string | null>(null)

  useEffect(() => {
    setSuggestion(initial)
  }, [initial])

  useEffect(() => {
    if (!suggestion || !shouldMarkSuggestionShown(suggestion.status)) {
      return
    }
    if (markedShownRef.current === suggestion.id) {
      return
    }
    markedShownRef.current = suggestion.id
    void markShownAction(suggestion.id)
  }, [suggestion])

  if (!suggestion) {
    return null
  }

  const active = suggestion
  const datedCount =
    typeof active.evidence.datedCount === 'number' ? active.evidence.datedCount : null
  const totalCount =
    typeof active.evidence.totalCount === 'number' ? active.evidence.totalCount : null
  const spaceName =
    typeof active.evidence.spaceName === 'string' ? active.evidence.spaceName : 'this space'
  const subline =
    datedCount !== null && totalCount !== null
      ? `${datedCount} of ${totalCount} open items in ${spaceName} have a day or time.`
      : active.reason

  async function accept() {
    setBusy('accept')
    setError(null)
    const result = await acceptSuggestionAction(active.id)
    setBusy(null)
    if (!result.ok) {
      setError(result.message)
      return
    }
    setSuggestion(null)
    setToast({
      id: crypto.randomUUID(),
      summary: result.data.summary,
      changeLogId: result.data.changeLogId,
      status: 'visible',
    })
    router.refresh()
  }

  async function dismiss() {
    setBusy('dismiss')
    setError(null)
    const result = await dismissSuggestionAction(active.id)
    setBusy(null)
    if (!result.ok) {
      setError(result.message)
      return
    }
    setSuggestion(null)
    router.refresh()
  }

  return (
    <>
      <section
        className="mb-6 rounded-xl border border-amber-200/80 bg-[#f8ebe0] p-5"
        aria-label="Suggestion from Athera"
      >
        <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-900/60">
          Athera suggests
        </p>
        <p className="mt-2 font-newsreader text-lg font-medium text-ink-primary">
          Most of your work has times. See it on a calendar?
        </p>
        <p className="mt-2 text-sm text-ink-muted">{subline}</p>
        {error ? (
          <p className="mt-2 text-sm text-error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void accept()}
            className="rounded-full bg-[#c45c26] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {busy === 'accept' ? (
              <>
                <Loader2 className="mr-1 inline h-3 w-3 animate-spin" aria-hidden />
                Working…
              </>
            ) : (
              'Add calendar view'
            )}
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void dismiss()}
            className="rounded-full px-4 py-2 text-sm font-medium text-ink-muted hover:bg-white/50 disabled:opacity-50"
          >
            {busy === 'dismiss' ? '…' : 'Not now'}
          </button>
        </div>
      </section>
      <AdaptationToast
        toast={toast}
        onClose={() => setToast(null)}
        onUpdate={(patch) => setToast((t) => (t ? { ...t, ...patch } : t))}
      />
    </>
  )
}
