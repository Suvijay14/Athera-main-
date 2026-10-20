'use client'

import { useState } from 'react'
import { FileText } from 'lucide-react'

import { addTask } from '@/lib/api'

function linesToTasks(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/^[-*•\d.)]+\s*/, '').trim())
    .filter((l) => l.length > 3 && l.length < 200)
    .slice(0, 15)
}

export default function BriefImportLab() {
  const [tasks, setTasks] = useState<string[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setStatus(null)
    const text = await f.text()
    setTasks(linesToTasks(text))
  }

  async function pushTasksToApi() {
    setBusy(true)
    setStatus(null)
    let ok = 0
    for (const title of tasks) {
      const r = await addTask(title, 'manual')
      if (r.success) ok++
    }
    setStatus(`Created ${ok}/${tasks.length} tasks via Athera task API (when online).`)
    setBusy(false)
  }

  return (
    <div className="space-y-4">
      <p className="text-body-sm text-secondary">
        Upload a plain-text syllabus or project brief. Each non-empty line becomes a suggested task (CTC brief
        extract simplified for Athera).
      </p>
      <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border-serenity cursor-pointer hover:bg-surface-container-low">
        <FileText size={18} />
        <span className="text-sm">Choose .txt or .md</span>
        <input type="file" accept=".txt,.md,text/plain" className="sr-only" onChange={onFile} />
      </label>
      {tasks.length > 0 && (
        <>
          <ul className="list-disc pl-5 text-sm space-y-1 text-on-surface">
            {tasks.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <button
            type="button"
            disabled={busy}
            onClick={pushTasksToApi}
            className="px-4 py-2 rounded-xl bg-primary text-on-primary text-sm disabled:opacity-50"
          >
            {busy ? 'Creating…' : 'Create tasks via API'}
          </button>
        </>
      )}
      {status && <p className="text-body-sm text-secondary">{status}</p>}
    </div>
  )
}
