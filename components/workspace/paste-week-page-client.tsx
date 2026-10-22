'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FileText } from 'lucide-react'
import { useCallback, useMemo, useState, useTransition } from 'react'

import { confirmPasteWeekAction } from '@/app/workspace/paste-week-actions'
import type { Entity, Space } from '@/lib/db/schemas'
import {
  buildPasteWeekPreview,
  PASTE_WEEK_TEXTAREA_PLACEHOLDER,
  type PasteWeekPreviewItem,
} from '@/lib/workspace/paste-week'
import { stashPasteWeekImportToast } from '@/components/workspace/paste-week-import-toast'
import { spaceListHref } from '@/lib/workspace/home-route'
import { cn } from '@/lib/utils'

type PasteWeekPageClientProps = {
  spaces: Space[]
  entities: Entity[]
  entityFieldKeys: string[]
  defaultSpaceId: string
  personalSpaceId: string
  calendarConnectHref: string
}

export function PasteWeekPageClient({
  spaces,
  entities,
  entityFieldKeys,
  defaultSpaceId,
  personalSpaceId,
  calendarConnectHref,
}: PasteWeekPageClientProps) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [preview, setPreview] = useState<PasteWeekPreviewItem[] | null>(null)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const parseCtx = useMemo(
    () => ({
      spaces,
      entities,
      entityFieldKeys,
      defaultSpaceId,
      personalSpaceId,
    }),
    [spaces, entities, entityFieldKeys, defaultSpaceId, personalSpaceId]
  )

  const includedCount = preview?.filter((r) => r.included).length ?? 0

  const runParse = useCallback(() => {
    setError(null)
    setSuccess(null)
    setParsing(true)
    window.setTimeout(() => {
      try {
        const rows = buildPasteWeekPreview(text, parseCtx, new Date())
        if (rows.length === 0) {
          setError('Nothing to preview — add at least one line with real content.')
          setPreview(null)
        } else {
          setPreview(rows)
        }
      } finally {
        setParsing(false)
      }
    }, 0)
  }, [text, parseCtx])

  function updateRow(id: string, patch: Partial<PasteWeekPreviewItem>) {
    setPreview((prev) => (prev ? prev.map((r) => (r.id === id ? { ...r, ...patch } : r)) : prev))
  }

  function confirm() {
    if (!preview) {
      return
    }
    const rows = preview.filter((r) => r.included && r.title.trim())
    if (rows.length === 0) {
      setError('Select at least one item to add.')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await confirmPasteWeekAction({
        rows: rows.map((r) => ({
          title: r.title.trim(),
          spaceId: r.spaceId,
          dueDate: r.dueDate,
          startAt: r.startAt,
          endAt: r.endAt,
          allDay: r.allDay,
          entityId: r.entityId,
        })),
      })
      if (!result.ok) {
        setError(result.message)
        return
      }
      stashPasteWeekImportToast(result.createdCount)
      setText('')
      setPreview(null)
      router.push(spaceListHref(defaultSpaceId))
      router.refresh()
    })
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 md:px-10">
      <div className="mb-6 flex items-center gap-2 text-ink-faint">
        <FileText size={18} aria-hidden />
        <span className="text-sm">Paste your week</span>
      </div>

      <h1 className="font-newsreader text-[1.75rem] font-medium leading-snug text-ink-primary md:text-[2rem]">
        Paste your week. Athera takes it from there.
      </h1>
      <p className="mt-2 text-sm text-ink-muted">
        Copy from your notes app, an email or a spreadsheet. No setup, no templates.
      </p>

      {success ? (
        <p className="mt-4 rounded-lg border border-sage/30 bg-sage-light px-4 py-3 text-sm text-ink-primary" role="status">
          {success}
        </p>
      ) : null}

      <section className="mt-8" aria-labelledby="paste-week-input-heading">
        <h2 id="paste-week-input-heading" className="text-sm font-semibold text-ink-primary">
          Your messy list
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Put in anything on your plate: personal errands, work, one client or many. Say who each task is for,
          like &quot;call Maria from Rivera Bakery&quot;, and add times if you have them, like 3, 2–3pm, 10 to
          11:30 or &quot;by Friday&quot;. Nothing is saved until you check it below.
        </p>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setPreview(null)
            setSuccess(null)
          }}
          rows={10}
          placeholder={PASTE_WEEK_TEXTAREA_PLACEHOLDER}
          className="mt-4 w-full resize-y rounded-xl border border-border-delicate bg-surface-paper px-4 py-3 font-mono text-sm leading-relaxed text-ink-primary placeholder:text-ink-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/25"
          aria-label="Your messy list"
        />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={parsing || !text.trim()}
            onClick={runParse}
            className="rounded-full bg-ink-primary px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {parsing ? 'Understanding…' : 'Preview what Athera understood'}
          </button>
          <Link href={calendarConnectHref} className="text-sm text-ink-muted underline-offset-2 hover:underline">
            Import Google Calendar
          </Link>
        </div>
        {error ? (
          <p className="mt-3 text-sm text-error" role="alert">
            {error}
          </p>
        ) : null}
      </section>

      {preview && preview.length > 0 ? (
        <section className="mt-10" aria-labelledby="paste-week-preview-heading">
          <h2 id="paste-week-preview-heading" className="text-sm font-semibold text-ink-primary">
            What Athera understood · {preview.length} items
          </h2>
          <p className="mt-1 text-xs text-ink-muted">Tap a chip to fix it — uncheck anything you don&apos;t want saved.</p>
          <ul className="mt-4 space-y-3">
            {preview.map((row) => (
              <li
                key={row.id}
                className={cn(
                  'rounded-xl border border-border-delicate bg-surface-paper p-4',
                  !row.included && 'opacity-50'
                )}
              >
                <div className="flex flex-wrap items-start gap-3">
                  <input
                    type="checkbox"
                    checked={row.included}
                    onChange={(e) => updateRow(row.id, { included: e.target.checked })}
                    className="mt-1"
                    aria-label={`Include ${row.title}`}
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <input
                      type="text"
                      value={row.title}
                      onChange={(e) => updateRow(row.id, { title: e.target.value })}
                      className="w-full rounded-md border border-border-delicate bg-white px-2 py-1.5 text-sm font-medium text-ink-primary"
                    />
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-surface-container px-2.5 py-1 text-ink-muted">{row.whenLabel}</span>
                      <label className="sr-only" htmlFor={`space-${row.id}`}>
                        Space for {row.title}
                      </label>
                      <select
                        id={`space-${row.id}`}
                        value={row.spaceId}
                        onChange={(e) => {
                          const space = spaces.find((s) => s.id === e.target.value)
                          updateRow(row.id, {
                            spaceId: e.target.value,
                            spaceLabel: space?.name ?? row.spaceLabel,
                            spaceTag: space?.name.slice(0, 2) + (space && space.name.length > 14 ? '…' : ''),
                          })
                        }}
                        className="rounded-full border border-border-delicate bg-white px-2 py-1 text-ink-primary"
                      >
                        {spaces.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                      {row.entityName ? (
                        <span
                          className="rounded-full bg-slate-light px-2.5 py-1 font-medium text-slate-stone"
                          title={row.entityName}
                        >
                          {row.spaceTag}
                        </span>
                      ) : null}
                      <span className="text-ink-faint">{row.kind === 'appointment' ? 'Timed' : 'Task'}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-ink-faint hover:text-ink-primary"
                    onClick={() => updateRow(row.id, { included: false })}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled={pending || includedCount === 0}
            onClick={confirm}
            className="mt-6 rounded-full bg-terracotta px-6 py-3 text-sm font-semibold text-white hover:bg-terracotta-soft disabled:opacity-50"
          >
            {pending ? 'Saving…' : `Looks right, organize my week (${includedCount})`}
          </button>
        </section>
      ) : null}
    </main>
  )
}
