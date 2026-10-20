'use client'

import { useState } from 'react'

import { SwipeableTaskRow } from '@/components/ctc/tasks/SwipeableTaskRow'

const INITIAL = [
  { id: '1', title: 'Review lecture notes', due: 'Today' },
  { id: '2', title: 'Email professor about office hours', due: 'Tomorrow' },
  { id: '3', title: 'Pack gear for study session', due: 'Fri' },
]

export default function TaskSwipeDemoLab() {
  const [tasks, setTasks] = useState(INITIAL)
  const [log, setLog] = useState<string | null>(null)

  return (
    <div className="space-y-3 max-w-md">
      <p className="text-body-sm text-secondary">Swipe a row left to reveal archive / delete (CTC mobile pattern).</p>
      {tasks.map((t) => (
        <SwipeableTaskRow
          key={t.id}
          onArchive={() => setLog(`Archived: ${t.title}`)}
          onDelete={() => {
            setTasks((prev) => prev.filter((x) => x.id !== t.id))
            setLog(`Deleted: ${t.title}`)
          }}
        >
          <div className="px-4 py-3">
            <div className="font-medium text-on-surface text-sm">{t.title}</div>
            <div className="text-xs text-secondary">{t.due}</div>
          </div>
        </SwipeableTaskRow>
      ))}
      {!tasks.length && <p className="text-sm text-secondary">All demo tasks cleared.</p>}
      {log && <p className="text-xs text-secondary">{log}</p>}
    </div>
  )
}
