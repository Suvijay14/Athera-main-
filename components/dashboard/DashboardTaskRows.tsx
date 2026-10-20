'use client'

import clsx from 'clsx'
import DummyControl from '@/components/DummyControl'
import type { Task } from '@/lib/types'

const sourceLabel: Record<Task['source'], string> = {
  canvas: 'School',
  gmail: 'Work',
  manual: 'Personal',
  notebook: 'Personal',
}

const sourceChip: Record<Task['source'], string> = {
  canvas: 'bg-domain-freelance-bg text-domain-freelance-text',
  gmail: 'bg-domain-freelance-bg text-domain-freelance-text',
  manual: 'bg-domain-errands-bg text-domain-errands-text',
  notebook: 'bg-domain-family-bg text-domain-family-text',
}

export default function DashboardTaskRows({
  tasks,
  emptyMessage,
}: {
  tasks: Task[]
  emptyMessage: string
}) {
  if (tasks.length === 0) {
    return <p className="text-body-sm text-secondary py-6 px-1">{emptyMessage}</p>
  }

  return (
    <ul className="divide-y divide-border-serenity/60">
      {tasks.map((task) => (
        <li key={task.id} className="flex items-start gap-3 py-3.5 group">
          <DummyControl
            as="div"
            title="Task completion uses the same handlers as Today's Tasks (not wired yet)"
            className={clsx(
              'w-[18px] h-[18px] rounded-md border mt-0.5 flex-shrink-0 flex items-center justify-center',
              task.completed
                ? 'bg-primary-container border-primary-container'
                : 'border-outline-variant bg-surface-container-lowest'
            )}
          >
            {task.completed && (
              <span className="material-symbols-outlined text-on-primary text-[14px]">check</span>
            )}
          </DummyControl>
          <div className="flex-1 min-w-0">
            <p
              className={clsx(
                'text-body-md font-medium',
                task.completed ? 'line-through text-secondary' : 'text-on-surface'
              )}
            >
              {task.title}
            </p>
            {(task.detail || task.dueDate) && (
              <p className="text-body-sm text-secondary mt-0.5 truncate">
                {[task.detail, task.dueDate].filter(Boolean).join(' · ')}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span
                className={clsx(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-jakarta font-semibold uppercase',
                  sourceChip[task.source]
                )}
              >
                <span className="w-1 h-1 rounded-full bg-current opacity-70" />
                {sourceLabel[task.source]}
              </span>
              {task.urgency === 'high' && (
                <span className="text-[10px] font-semibold text-domain-urgent-text bg-domain-urgent-bg px-2 py-0.5 rounded-full">
                  Due today
                </span>
              )}
            </div>
          </div>
          <span className="material-symbols-outlined text-[18px] text-outline-variant opacity-0 group-hover:opacity-100 transition-opacity">
            schedule
          </span>
        </li>
      ))}
    </ul>
  )
}
