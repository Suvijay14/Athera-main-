'use client'

import { useState } from 'react'

import { addTask } from '@/lib/api'

export default function NewTaskModalLab() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function save() {
    if (!title.trim()) return
    setBusy(true)
    setMessage(null)
    const r = await addTask(`[${priority}] ${title.trim()}`, 'manual')
    setMessage(r.success ? 'Task sent to Athera API.' : 'API offline — start dev server with task routes.')
    setBusy(false)
    if (r.success) {
      setTitle('')
      setOpen(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-body-sm text-secondary">CTC new-task modal — creates a task through {`lib/api.addTask`}.</p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-medium"
      >
        Open new task modal
      </button>
      {message && <p className="text-body-sm text-secondary">{message}</p>}

      {open && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-inverse-surface/40" aria-label="Close" onClick={() => setOpen(false)} />
          <div className="relative card-v2 w-full max-w-md p-5 space-y-4">
            <h3 className="font-jakarta text-headline-md">New task</h3>
            <input
              className="w-full rounded-xl border border-border-serenity px-3 py-2 text-sm bg-surface-container-lowest"
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <select
              className="w-full rounded-xl border border-border-serenity px-3 py-2 text-sm"
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <div className="flex gap-2 justify-end">
              <button type="button" className="px-3 py-2 text-sm text-secondary" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={save}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary text-sm disabled:opacity-50"
              >
                {busy ? 'Saving…' : 'Save task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
