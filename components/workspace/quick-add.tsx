'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'

import { quickAddPlaceholderForIndex } from '@/lib/onboarding/quick-add-placeholders'

import { quickCreateWorkItemAction } from '@/app/workspace/actions'
import { useWorkspaceUi } from '@/components/workspace/workspace-ui-context'
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue'
import { formatQuickAddPreview } from '@/lib/workspace/format-quick-add-preview'
import { parseQuickAdd } from '@/lib/workspace/parse-quick-add'
import { quickAddParseToCreatePayload } from '@/lib/workspace/quick-add-submit'

type QuickAddProps = {
  itemLabel: string
  /** Space page context for hard-rule routing. */
  spaceResolution: {
    fromSpaceView: boolean
    contextSpaceId: string | null
  }
  autoFocus?: boolean
  rotatingPlaceholder?: boolean
}

export function QuickAdd({
  itemLabel,
  spaceResolution,
  autoFocus = false,
  rotatingPlaceholder = false,
}: QuickAddProps) {
  const router = useRouter()
  const { showActivityToast } = useWorkspaceUi()
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const debouncedTitle = useDebouncedValue(title, 150)
  const parsed = useMemo(
    () => parseQuickAdd(debouncedTitle, new Date()),
    [debouncedTitle]
  )
  const preview = formatQuickAddPreview(parsed)
  const inputRef = useRef<HTMLInputElement>(null)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus()
    }
  }, [autoFocus])

  useEffect(() => {
    if (!rotatingPlaceholder) {
      return
    }
    const id = window.setInterval(() => {
      setPlaceholderIndex((i) => i + 1)
    }, 5000)
    return () => window.clearInterval(id)
  }, [rotatingPlaceholder])

  const placeholder = rotatingPlaceholder
    ? quickAddPlaceholderForIndex(placeholderIndex)
    : '+ Add a task, like: call maria thu 2-3pm'

  function submit() {
    const trimmed = title.trim()
    if (!trimmed) {
      return
    }
    setError(null)
    const live = parseQuickAdd(trimmed, new Date())
    const payload = quickAddParseToCreatePayload(live)
    startTransition(async () => {
      try {
        const result = await quickCreateWorkItemAction({ ...payload, spaceResolution })
        if (!result.ok) {
          setError(result.message)
          return
        }
        if (result.reactivatedEntityName) {
          showActivityToast(`${result.reactivatedEntityName} is active again`)
        }
        if (result.spaceSort?.unsorted) {
          showActivityToast('Added, but needs a space — check Overview')
        }
        setTitle('')
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not add')
      }
    })
  }

  const highlight =
    parsed.matchedText && debouncedTitle === title.trim()
      ? (() => {
          const idx = title.toLowerCase().indexOf(parsed.matchedText.toLowerCase())
          if (idx < 0) {
            return null
          }
          return {
            before: title.slice(0, idx),
            match: title.slice(idx, idx + parsed.matchedText.length),
            after: title.slice(idx + parsed.matchedText.length),
          }
        })()
      : null

  return (
    <div className="mb-6">
      <label htmlFor="quick-add" className="sr-only">
        Add a {itemLabel}
      </label>
      <div className="relative">
        {highlight ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg border border-transparent px-4 py-3 text-sm"
          >
            <span className="text-neutral-900">{highlight.before}</span>
            <span className="rounded bg-primary/15 text-primary">{highlight.match}</span>
            <span className="text-neutral-900">{highlight.after}</span>
          </div>
        ) : null}
        <input
          ref={inputRef}
          id="quick-add"
          type="text"
          disabled={pending}
          placeholder={placeholder}
          className="relative w-full rounded-xl border border-border-delicate bg-surface-paper py-3 pl-4 pr-28 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/25 disabled:opacity-60"
          style={highlight ? { color: 'transparent', caretColor: '#171717' } : undefined}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              submit()
            }
          }}
        />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-faint">
          Enter to add
        </span>
      </div>
      {preview && debouncedTitle === title.trim() ? (
        <p className="mt-2 inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-700">
          {preview}
        </p>
      ) : null}
      {pending ? (
        <p className="mt-1 text-xs text-neutral-500" aria-live="polite">
          Adding…
        </p>
      ) : null}
      {error ? (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
