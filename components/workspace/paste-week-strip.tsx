'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'

import { pasteWeekAction } from '@/app/workspace/paste-week-actions'
import { Button } from '@/components/ctc/ui/Button'

const DISMISS_KEY_PREFIX = 'athera_paste_week_dismissed_'

type PasteWeekStripProps = {
  spaceId: string
  itemCount: number
  calendarConnectHref: string
}

export function PasteWeekStrip({ spaceId, itemCount, calendarConnectHref }: PasteWeekStripProps) {
  const searchParams = useSearchParams()
  const forceOpen = searchParams.get('pasteWeek') === '1'
  const [text, setText] = useState('')
  const [dismissed, setDismissed] = useState(true)
  const [summary, setSummary] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (forceOpen) {
      setDismissed(false)
      return
    }
    if (typeof window === 'undefined') {
      return
    }
    const key = `${DISMISS_KEY_PREFIX}${spaceId}`
    setDismissed(window.localStorage.getItem(key) === '1')
  }, [spaceId, forceOpen])

  if (itemCount > 0 || (dismissed && !forceOpen)) {
    return summary ? (
      <p className="mb-4 text-sm text-emerald-800" role="status">
        {summary}
      </p>
    ) : null
  }

  function dismiss() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(`${DISMISS_KEY_PREFIX}${spaceId}`, '1')
    }
    setDismissed(true)
  }

  function submitPaste() {
    setError(null)
    startTransition(async () => {
      const result = await pasteWeekAction({ spaceId, text })
      if (!result.ok) {
        setError(result.message)
        return
      }
      setSummary(`${result.createdCount} items added.`)
      setText('')
      dismiss()
    })
  }

  return (
    <section
      className="mb-4 rounded-lg border border-neutral-200 bg-white px-4 py-4"
      aria-label="Paste your week"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">Paste your week</h2>
          <p className="mt-1 text-xs text-neutral-600">
            Paste a list — one line per task or appointment. Dates like “Tue 4pm” are parsed automatically.
          </p>
        </div>
        <button type="button" className="text-xs text-neutral-500 hover:text-neutral-800" onClick={dismiss}>
          Dismiss
        </button>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder={'Rivera quote follow-up Thu 2pm\nDana Kim check-in\nDentist Tue 3pm'}
        className="mt-3 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
      />
      {error ? (
        <p className="mt-2 text-xs text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button type="button" size="sm" disabled={pending || !text.trim()} onClick={submitPaste}>
          {pending ? 'Adding…' : 'Add items'}
        </Button>
        <span className="text-xs text-neutral-500">or</span>
        <a
          href={calendarConnectHref}
          className="text-xs font-medium text-primary underline-offset-2 hover:underline"
        >
          Import from Google Calendar
        </a>
        <span className="text-xs text-neutral-500">(Personal plan; read-only)</span>
      </div>
    </section>
  )
}
