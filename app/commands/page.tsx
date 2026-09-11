'use client'

import { useCallback, useEffect, useState } from 'react'
import clsx from 'clsx'
import { fetchCommandsStatus, submitCommandFeedback, type CommandsStatus } from '@/lib/commands'

export default function CommandsPage() {
  const [data, setData] = useState<CommandsStatus | null>(null)
  const [lastFetch, setLastFetch] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    const result = await fetchCommandsStatus()
    if (result) {
      setData(result)
      setLastFetch(new Date().toLocaleTimeString())
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [load])

  async function markRow(
    row: { command: string; phrase: string; tool: string },
    status: 'confirmed' | 'broken',
    error?: string
  ) {
    setBusy(`${row.tool}-${status}`)
    const phrase = row.phrase.replace(/^"|"$/g, '')
    await submitCommandFeedback({
      phrase,
      response: status === 'confirmed' ? 'Marked working from /commands page' : 'Marked broken from /commands page',
      tool: row.tool,
      status,
      error,
    })
    await load()
    setBusy(null)
  }

  if (!data) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 bg-surface-container rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="min-h-full p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-newsreader text-ink-primary">Command Status</h1>
          <p className="text-sm text-ink-muted mt-1">
            Live view of COMMANDS.md — updated from Voice feedback and this page
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-faint">
          <span className="bg-sage-light text-sage px-2 py-1 rounded-full font-medium">
            Live · updated {lastFetch || '—'}
          </span>
        </div>
      </div>

      <div className="flex gap-3 mb-8">
        <span className="bg-sage-light text-sage text-xs font-semibold px-3 py-1.5 rounded-full">
          {data.confirmed.length} confirmed
        </span>
        <span className="bg-red-50 text-red-700 text-xs font-semibold px-3 py-1.5 rounded-full">
          {data.broken.length} broken
        </span>
        <span className="bg-surface-container text-ink-muted text-xs font-semibold px-3 py-1.5 rounded-full">
          {data.untested.length} untested
        </span>
      </div>

      <section className="mb-8">
        <h2 className="label-caps text-sage mb-3">✅ Confirmed Working</h2>
        <div className="card-vellum overflow-hidden border-l-2 border-l-sage">
          <table className="w-full text-sm">
            <thead className="bg-surface-container text-left text-xs label-caps">
              <tr>
                <th className="px-4 py-2">Command</th>
                <th className="px-4 py-2">Phrase</th>
                <th className="px-4 py-2">Tool</th>
                <th className="px-4 py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {data.confirmed.map((row) => (
                <tr key={`c-${row.command}-${row.phrase}`} className="border-t border-border-delicate">
                  <td className="px-4 py-2 font-medium">{row.command}</td>
                  <td className="px-4 py-2 text-ink-secondary">{row.phrase}</td>
                  <td className="px-4 py-2 font-mono text-xs">{row.tool}</td>
                  <td className="px-4 py-2 text-ink-muted text-xs">{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="label-caps text-red-600 mb-3">❌ Broken</h2>
        <div className="card-vellum overflow-hidden border-l-2 border-l-red-400">
          <table className="w-full text-sm">
            <thead className="bg-surface-container text-left text-xs label-caps">
              <tr>
                <th className="px-4 py-2">Command</th>
                <th className="px-4 py-2">Phrase</th>
                <th className="px-4 py-2">Error</th>
                <th className="px-4 py-2">Fix needed</th>
              </tr>
            </thead>
            <tbody>
              {data.broken.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-ink-faint text-xs">
                    No broken commands logged yet.
                  </td>
                </tr>
              ) : (
                data.broken.map((row) => (
                  <tr key={`b-${row.command}-${row.phrase}`} className="border-t border-border-delicate">
                    <td className="px-4 py-2 font-medium">{row.command}</td>
                    <td className="px-4 py-2 text-ink-secondary">{row.phrase}</td>
                    <td className="px-4 py-2 text-red-700 text-xs">{row.error}</td>
                    <td className="px-4 py-2 text-ink-muted text-xs">{row.fix}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="label-caps text-ink-muted mb-3">⏳ Not Yet Tested</h2>
        <div className="card-vellum overflow-hidden border-l-2 border-l-slate-stone/30">
          <table className="w-full text-sm">
            <thead className="bg-surface-container text-left text-xs label-caps">
              <tr>
                <th className="px-4 py-2">Command</th>
                <th className="px-4 py-2">Phrase</th>
                <th className="px-4 py-2">Tool</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.untested.map((row) => (
                <tr key={`u-${row.command}-${row.tool}`} className="border-t border-border-delicate">
                  <td className="px-4 py-2 font-medium">{row.command}</td>
                  <td className="px-4 py-2 text-ink-secondary">{row.phrase}</td>
                  <td className="px-4 py-2 font-mono text-xs">{row.tool}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busy === `${row.tool}-confirmed`}
                        onClick={() => markRow(row, 'confirmed')}
                        className={clsx(
                          'text-[10px] px-2 py-1 rounded-md font-medium',
                          'bg-sage-light text-sage hover:bg-sage/20 transition-colors',
                          busy === `${row.tool}-confirmed` && 'opacity-50'
                        )}
                      >
                        ✓ Mark working
                      </button>
                      <button
                        type="button"
                        disabled={busy === `${row.tool}-broken`}
                        onClick={() => {
                          const err = window.prompt('What went wrong? (brief)')
                          if (err) markRow(row, 'broken', err)
                        }}
                        className={clsx(
                          'text-[10px] px-2 py-1 rounded-md font-medium',
                          'bg-red-50 text-red-700 hover:bg-red-100 transition-colors',
                          busy === `${row.tool}-broken` && 'opacity-50'
                        )}
                      >
                        ✗ Mark broken
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
