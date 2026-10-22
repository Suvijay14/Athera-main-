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
import {
  entityCountPillsFromOperations,
  groupByCtaFromOperations,
  parseSuggestionOps,
  repeatedEntityHeadline,
  repeatedEntityReasoningLine,
} from '@/lib/adaptation/repeated-entity-suggestion-copy'
import { shouldMarkSuggestionShown } from '@/lib/adaptation/suggestion-ui'
import type { Suggestion } from '@/lib/db/schemas'

type RepeatedEntitySuggestionCardProps = {
  suggestion: Suggestion
}

export function RepeatedEntitySuggestionCard({ suggestion: initial }: RepeatedEntitySuggestionCardProps) {
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
  const operations = parseSuggestionOps(active.operations)
  const pills = entityCountPillsFromOperations(operations)
  const kind = typeof active.evidence.kind === 'string' ? active.evidence.kind : 'client'
  const primaryName = typeof active.evidence.entity === 'string' ? active.evidence.entity : ''
  const headline = repeatedEntityHeadline(active.evidence, kind)
  const reasoning = repeatedEntityReasoningLine(pills, primaryName)
  const cta = groupByCtaFromOperations(operations)

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
        className="mb-6 rounded-xl border border-border-delicate bg-surface-paper p-5"
        aria-label="Suggestion from Athera"
      >
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Athera suggests</p>
        <p className="mt-2 font-newsreader text-lg font-medium text-ink-primary">{headline}</p>
        {reasoning ? <p className="mt-2 text-sm text-ink-muted">{reasoning}</p> : null}
        {pills.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {pills.map((pill) => (
              <span
                key={pill.name}
                className="rounded-full border border-border-delicate bg-surface-container/80 px-3 py-1 text-xs font-medium text-ink-primary"
              >
                {pill.name} · {pill.count}
              </span>
            ))}
          </div>
        ) : null}
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
            className="rounded-full bg-ink-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {busy === 'accept' ? (
              <>
                <Loader2 className="mr-1 inline h-3 w-3 animate-spin" aria-hidden />
                Working…
              </>
            ) : (
              cta
            )}
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void dismiss()}
            className="rounded-full px-4 py-2 text-sm font-medium text-ink-muted hover:bg-surface-container disabled:opacity-50"
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
