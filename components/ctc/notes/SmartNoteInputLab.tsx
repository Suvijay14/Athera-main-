'use client'

import { useMemo, useState } from 'react'
import { Send } from 'lucide-react'

import { CORE_WORKSPACES } from '@/lib/dashboard/workspaces'

const NOTES_KEY = 'athera_lab_smart_notes'

export default function SmartNoteInputLab() {
  const [value, setValue] = useState('')
  const [saved, setSaved] = useState<{ content: string; at: string }[]>([])

  const mentionOptions = useMemo(
    () => CORE_WORKSPACES.map((w) => ({ handle: w.label.replace(/\s+/g, ''), label: w.label })),
    []
  )

  function submit() {
    if (!value.trim()) return
    const entry = { content: value.trim(), at: new Date().toISOString() }
    const next = [entry, ...saved].slice(0, 10)
    setSaved(next)
    try {
      localStorage.setItem(NOTES_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
    setValue('')
  }

  return (
    <div className="space-y-4">
      <p className="text-body-sm text-secondary">
        Type <code className="text-xs">@School</code> / workspace names. Notes save to localStorage (
        {NOTES_KEY}).
      </p>
      <div className="flex flex-wrap gap-1 text-xs text-secondary">
        {mentionOptions.map((m) => (
          <button
            key={m.handle}
            type="button"
            className="px-2 py-0.5 rounded-full bg-surface-container hover:bg-surface-container-high"
            onClick={() => setValue((v) => (v ? `${v} @${m.handle} ` : `@${m.handle} `))}
          >
            @{m.handle}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <textarea
          className="flex-1 min-h-[88px] rounded-xl border border-border-serenity px-3 py-2 text-sm resize-y"
          placeholder="Write a note… use @School @Work"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button
          type="button"
          onClick={submit}
          className="self-end p-2.5 rounded-xl bg-primary text-on-primary"
          aria-label="Save note"
        >
          <Send size={18} />
        </button>
      </div>
      {saved.length > 0 && (
        <ul className="space-y-2 text-sm">
          {saved.map((n) => (
            <li key={n.at} className="rounded-lg bg-surface-container-low px-3 py-2">
              {n.content}
              <div className="text-[10px] text-secondary mt-1">{new Date(n.at).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
