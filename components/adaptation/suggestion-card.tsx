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
import { PreviewDrawer } from '@/components/adaptation/preview-drawer'
import { Button } from '@/components/ctc/ui/Button'
import { shouldMarkSuggestionShown } from '@/lib/adaptation/suggestion-ui'
import type { Suggestion } from '@/lib/db/schemas'

type PendingAction = 'accept' | 'dismiss' | null

type SuggestionCardProps = {
  suggestion: Suggestion | null
}

export function SuggestionCard({ suggestion: initialSuggestion }: SuggestionCardProps) {
  const router = useRouter()
  const [suggestion, setSuggestion] = useState(initialSuggestion)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [inlineError, setInlineError] = useState<string | null>(null)
  const [toast, setToast] = useState<ActiveAdaptationToast | null>(null)
  const markedShownRef = useRef<string | null>(null)

  useEffect(() => {
    setSuggestion(initialSuggestion)
  }, [initialSuggestion])

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
    return (
      <>
        <AdaptationToast
          toast={toast}
          onClose={() => setToast(null)}
          onUpdate={(patch) => setToast((t) => (t ? { ...t, ...patch } : t))}
        />
      </>
    )
  }

  const busy = pendingAction !== null

  async function handleAccept() {
    setPendingAction('accept')
    setInlineError(null)
    const result = await acceptSuggestionAction(suggestion!.id)
    setPendingAction(null)
    if (!result.ok) {
      setInlineError(result.message)
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

  async function handleDismiss() {
    setPendingAction('dismiss')
    setInlineError(null)
    const result = await dismissSuggestionAction(suggestion!.id)
    setPendingAction(null)
    if (!result.ok) {
      setInlineError(result.message)
      return
    }
    setSuggestion(null)
    router.refresh()
  }

  return (
    <>
      <section
        className="mb-4 rounded-xl border border-border-serenity bg-surface-container-low p-4 shadow-sm"
        aria-label="Suggestion from Athera"
      >
        <p className="text-sm text-on-surface">{suggestion.reason}</p>
        {inlineError ? (
          <p className="mt-2 text-sm text-error" role="alert">
            {inlineError}
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => setPreviewOpen(true)}
          >
            Preview
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={busy}
            onClick={() => void handleAccept()}
          >
            {pendingAction === 'accept' ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" aria-hidden />
                Accepting…
              </>
            ) : (
              'Accept'
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => void handleDismiss()}
          >
            {pendingAction === 'dismiss' ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" aria-hidden />
                Dismissing…
              </>
            ) : (
              'Not now'
            )}
          </Button>
        </div>
      </section>

      <PreviewDrawer
        open={previewOpen}
        suggestionId={suggestion.id}
        onClose={() => setPreviewOpen(false)}
      />

      <AdaptationToast
        toast={toast}
        onClose={() => setToast(null)}
        onUpdate={(patch) => setToast((t) => (t ? { ...t, ...patch } : t))}
      />
    </>
  )
}
