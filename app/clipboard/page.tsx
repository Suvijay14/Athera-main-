'use client'

import { useCallback, useEffect, useState } from 'react'

export default function ClipboardPage() {
  const [content, setContent] = useState('')
  const [writeText, setWriteText] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch('/api/clipboard')
      const data = (await res.json()) as { content?: string; empty?: boolean }
      setContent(data.empty ? '' : (data.content ?? ''))
    } catch {
      setMessage('Could not read clipboard.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleCopy = async () => {
    if (!writeText.trim()) return
    setMessage('')
    try {
      const res = await fetch('/api/clipboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: writeText.trim() }),
      })
      const data = (await res.json()) as { ok?: boolean; message?: string; error?: string }
      if (!res.ok) {
        setMessage(data.error ?? 'Copy failed.')
        return
      }
      setMessage(data.message ?? 'Copied to clipboard.')
      setWriteText('')
      await refresh()
    } catch {
      setMessage('Copy failed.')
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <span className="label-caps">System</span>
        <h1 className="font-newsreader text-3xl text-ink-primary mt-2">Clipboard</h1>
        <p className="text-sm text-ink-muted mt-2">
          Read or write your Mac clipboard. Voice: &quot;what&apos;s in my clipboard&quot; or
          &quot;copy hello to clipboard&quot;.
        </p>
      </div>

      <div className="card p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-ink-primary">Current contents</h2>
          <button
            type="button"
            onClick={refresh}
            className="text-xs text-terracotta hover:underline"
          >
            Refresh
          </button>
        </div>
        {loading ? (
          <p className="text-sm text-ink-faint">Reading clipboard…</p>
        ) : (
          <pre className="text-sm text-ink-secondary whitespace-pre-wrap break-words min-h-[4rem] bg-surface-vellum rounded-lg p-3 border border-border-delicate">
            {content || '(empty)'}
          </pre>
        )}
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-medium text-ink-primary mb-3">Copy to clipboard</h2>
        <textarea
          value={writeText}
          onChange={(e) => setWriteText(e.target.value)}
          placeholder="Type text to copy…"
          rows={4}
          className="w-full text-sm rounded-lg border border-border-delicate p-3 bg-white resize-y"
        />
        <button
          type="button"
          onClick={handleCopy}
          disabled={!writeText.trim()}
          className="mt-3 px-4 py-2 rounded-lg bg-terracotta text-white text-sm font-medium disabled:opacity-40 hover:bg-terracotta-soft transition-colors"
        >
          Copy to clipboard
        </button>
        {message && <p className="text-sm text-ink-muted mt-3">{message}</p>}
      </div>
    </div>
  )
}
