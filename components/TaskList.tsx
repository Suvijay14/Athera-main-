'use client'

import { useEffect, useState } from 'react'
import DummyControl from '@/components/DummyControl'
import { fetchTasks, addTask } from '@/lib/api'
import { Task } from '@/lib/types'
import clsx from 'clsx'

const sourceColors: Record<string, string> = {
  canvas: 'bg-slate-light text-slate-stone',
  gmail: 'bg-terracotta-light text-terracotta',
  manual: 'bg-surface-container text-ink-muted',
  notebook: 'bg-ochre-light text-ochre',
}

const urgencyStyles: Record<string, string> = {
  high: 'bg-terracotta text-white',
  medium: 'bg-ochre-light text-ochre',
  low: 'bg-sage-light text-sage',
  none: '',
}

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [newTask, setNewTask] = useState('')

  useEffect(() => {
    fetchTasks()
      .then((data) => setTasks(data.tasks))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false))
  }, [])

  const filters = ['all', 'canvas', 'gmail', 'manual']
  const filtered = tasks.filter((t) => (filter === 'all' ? true : t.source === filter))

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault()
    if (!newTask.trim()) return
    await addTask(newTask.trim())
    setTasks((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        title: newTask.trim(),
        completed: false,
        source: 'manual',
        urgency: 'none',
      },
    ])
    setNewTask('')
  }

  return (
    <div className="card p-5 h-full w-full min-h-0 min-w-0 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-base">☰</span>
          <h2 className="font-newsreader text-lg text-ink-primary">Today&apos;s Tasks</h2>
        </div>
        {tasks.length > 0 && (
          <span className="text-xs text-ink-faint">
            {tasks.filter((t) => !t.completed).length} of {tasks.length} remaining
          </span>
        )}
      </div>

      {tasks.length > 0 && (
        <div className="flex gap-1.5 mb-4 flex-wrap flex-shrink-0">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                'px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize',
                filter === f
                  ? 'bg-terracotta text-white'
                  : 'bg-surface-container text-ink-muted hover:text-ink-primary'
              )}
            >
              {f}{' '}
              {f === 'all'
                ? `(${tasks.length})`
                : `(${tasks.filter((t) => t.source === f).length})`}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden">
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 bg-surface-container rounded animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-ink-faint py-4">No tasks yet. Connect the API or add one below.</p>
      ) : (
        <div className="space-y-0.5">
          {filtered.map((task) => (
            <div
              key={task.id}
              className="flex items-start gap-3 py-3 border-b border-border-delicate last:border-0 group"
            >
              <DummyControl
                as="div"
                title="Task completion not wired yet"
                className={clsx(
                  'w-4 h-4 rounded border mt-0.5 flex-shrink-0 flex items-center justify-center p-0',
                  task.completed
                    ? 'bg-terracotta border-terracotta'
                    : 'border-border-subtle bg-white'
                )}
              >
                {task.completed && <span className="text-white text-[10px]">✓</span>}
              </DummyControl>

              <div className="flex-1 min-w-0">
                <p
                  className={clsx(
                    'text-sm',
                    task.completed ? 'line-through text-ink-faint' : 'text-ink-primary'
                  )}
                >
                  {task.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={clsx(
                      'text-[10px] px-1.5 py-0.5 rounded font-medium capitalize',
                      sourceColors[task.source]
                    )}
                  >
                    {task.source}
                  </span>
                  {task.dueDate && (
                    <span
                      className={clsx(
                        'text-[10px] text-ink-faint',
                        task.urgency === 'high' && 'text-terracotta font-medium'
                      )}
                    >
                      {task.dueDate}
                    </span>
                  )}
                  {task.detail && (
                    <span className="text-[10px] text-ink-faint truncate">· {task.detail}</span>
                  )}
                </div>
              </div>

              {task.urgency !== 'none' && (
                <span
                  className={clsx(
                    'text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide flex-shrink-0',
                    urgencyStyles[task.urgency]
                  )}
                >
                  {task.urgency === 'high' ? 'TODAY' : task.urgency}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      </div>

      <form
        onSubmit={handleAddTask}
        className="mt-3 pt-3 border-t border-border-delicate flex items-center gap-2 flex-shrink-0"
      >
        <input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a task..."
          className="flex-1 text-xs text-ink-primary placeholder-ink-faint outline-none bg-transparent"
        />
        {newTask && (
          <button type="submit" className="text-xs text-terracotta font-medium hover:underline">
            + Add
          </button>
        )}
      </form>
    </div>
  )
}
