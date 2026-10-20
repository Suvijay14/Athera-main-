'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { X } from 'lucide-react'

import { previewSuggestionAction } from '@/app/workspace/suggestion-actions'
import { Button } from '@/components/ctc/ui/Button'
import type { SuggestionPreview } from '@/lib/adaptation/preview-build'

type PreviewDrawerProps = {
  open: boolean
  suggestionId: string
  onClose: () => void
}

export function PreviewDrawer({ open, suggestionId, onClose }: PreviewDrawerProps) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<SuggestionPreview | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await previewSuggestionAction(suggestionId)
    setLoading(false)
    if (!result.ok) {
      setError(result.message)
      setPreview(null)
      return
    }
    setPreview(result.data)
  }, [suggestionId])

  useEffect(() => {
    if (!open) {
      setPreview(null)
      setError(null)
      return
    }
    void load()
    const t = window.setTimeout(() => closeRef.current?.focus(), 0)
    return () => window.clearTimeout(t)
  }, [open, load])

  useEffect(() => {
    if (!open) {
      return
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close preview"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-2xl border border-border-serenity bg-surface-container-lowest shadow-serenity-lg sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-border-serenity px-4 py-3">
          <h2 id={titleId} className="text-base font-semibold text-on-surface">
            Preview
          </h2>
          <Button
            ref={closeRef}
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="overflow-y-auto px-4 py-4">
          {loading ? (
            <p className="text-sm text-on-surface-variant">Loading preview…</p>
          ) : null}
          {error ? (
            <p className="text-sm text-error" role="alert">
              {error}
            </p>
          ) : null}
          {preview && !loading ? (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-on-surface">{preview.summary}</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-on-surface-variant">
                {preview.operationDescriptions.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              {preview.affectedItemCount > 0 ? (
                <p className="text-sm text-on-surface-variant">
                  {preview.affectedItemCount} item
                  {preview.affectedItemCount === 1 ? '' : 's'} will be updated
                  {preview.sampleItems.length > 0 ? (
                    <>
                      , including:{' '}
                      {preview.sampleItems.map((item) => item.title).join(', ')}
                    </>
                  ) : null}
                  .
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="border-t border-border-serenity px-4 py-3">
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
