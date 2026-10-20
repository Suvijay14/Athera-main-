'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'

import { undoLatestChangeAction } from '@/app/workspace/suggestion-actions'
import { Button } from '@/components/ctc/ui/Button'

const DISMISS_MS = 15_000

export type ActiveAdaptationToast = {
  id: string
  summary: string
  /** When set, show Undo and call undoLatestChangeAction. */
  changeLogId?: string
  status: 'visible' | 'undoing' | 'undone' | 'error'
  errorMessage?: string
}

type AdaptationToastProps = {
  toast: ActiveAdaptationToast | null
  onClose: () => void
  onUpdate: (patch: Partial<ActiveAdaptationToast>) => void
}

export function AdaptationToast({ toast, onClose, onUpdate }: AdaptationToastProps) {
  const router = useRouter()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const remainingRef = useRef(DISMISS_MS)
  const startedRef = useRef<number | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const scheduleDismiss = useCallback(() => {
    clearTimer()
    if (!toast || toast.status === 'undoing' || toast.status === 'undone') {
      return
    }
    startedRef.current = Date.now()
    timerRef.current = setTimeout(onClose, remainingRef.current)
  }, [clearTimer, onClose, toast])

  useEffect(() => {
    if (!toast) {
      clearTimer()
      remainingRef.current = DISMISS_MS
      return
    }
    if (toast.status === 'undone') {
      clearTimer()
      const t = setTimeout(onClose, 2500)
      return () => clearTimeout(t)
    }
    remainingRef.current = DISMISS_MS
    scheduleDismiss()
    return clearTimer
  }, [toast?.id, toast?.status, clearTimer, scheduleDismiss, onClose, toast])

  const pauseTimer = () => {
    if (startedRef.current !== null) {
      remainingRef.current -= Date.now() - startedRef.current
      startedRef.current = null
    }
    clearTimer()
  }

  const resumeTimer = () => {
    if (toast && toast.status === 'visible') {
      scheduleDismiss()
    }
  }

  if (!toast) {
    return null
  }

  async function handleUndo() {
    if (!toast?.changeLogId) {
      return
    }
    pauseTimer()
    onUpdate({ status: 'undoing' })
    const result = await undoLatestChangeAction(toast.changeLogId)
    if (!result.ok) {
      onUpdate({ status: 'error', errorMessage: result.message })
      resumeTimer()
      return
    }
    onUpdate({ status: 'undone' })
    router.refresh()
  }

  const title =
    toast.status === 'undone'
      ? 'Change undone'
      : toast.status === 'error'
        ? toast.errorMessage ?? 'Undo failed'
        : `${toast.summary}.`

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-[200] sm:left-auto sm:right-4 sm:max-w-md"
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
      onFocus={pauseTimer}
      onBlur={resumeTimer}
    >
      <div
        role="status"
        className="flex items-start gap-3 rounded-xl border border-border-serenity border-l-4 border-l-primary-container bg-inverse-surface px-4 py-3.5 text-inverse-on-surface shadow-serenity-lg"
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{title}</p>
          {toast.status === 'visible' && toast.changeLogId ? (
            <div className="mt-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={toast.status !== 'visible'}
                onClick={() => void handleUndo()}
              >
                Undo
              </Button>
            </div>
          ) : null}
          {toast.status === 'undoing' ? (
            <p className="mt-1 text-xs opacity-80">Undoing…</p>
          ) : null}
        </div>
        <button
          type="button"
          className="shrink-0 opacity-70 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Dismiss"
          onClick={onClose}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
