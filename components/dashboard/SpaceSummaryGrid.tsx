'use client'

import Link from 'next/link'
import { CORE_WORKSPACES } from '@/lib/dashboard/workspaces'
import type { Task } from '@/lib/types'
import { openTaskCount } from '@/lib/dashboard/task-filters'

export default function SpaceSummaryGrid({
  tasks,
  dynamicSpaces,
}: {
  tasks: Task[]
  dynamicSpaces: { slug: string; name: string; href?: string }[]
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-jakarta text-headline-md text-on-surface">Across your spaces</h2>
        <p className="text-body-sm text-secondary mt-1">A quick read on what&apos;s moving.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {CORE_WORKSPACES.map((ws) => {
          const wsTasks = tasks.filter((t) => !t.completed && ws.taskFilter(t))
          const open = openTaskCount(wsTasks)
          return (
            <Link
              key={ws.id}
              href={ws.href}
              className="card-v2 p-5 hover:shadow-serenity-lg transition-shadow group"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: ws.accentBg, color: ws.accentText }}
                >
                  <span className="material-symbols-outlined text-[20px]">{ws.icon}</span>
                </div>
                <span className="material-symbols-outlined text-[18px] text-outline-variant group-hover:text-primary transition-colors">
                  north_east
                </span>
              </div>
              <h3 className="font-jakarta text-label-lg text-on-surface mb-1">{ws.label}</h3>
              <p className="text-body-sm text-secondary">
                {open > 0
                  ? `${open} open task${open === 1 ? '' : 's'} (by source mapping)`
                  : 'No open tasks for this space mapping'}
              </p>
            </Link>
          )
        })}
        {dynamicSpaces.map((space) => (
          <Link
            key={space.slug}
            href={space.href ?? '/'}
            className="card-v2 p-5 hover:shadow-serenity-lg transition-shadow group border-dashed"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-primary-fixed/50 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px]">folder</span>
              </div>
              <span className="material-symbols-outlined text-[18px] text-outline-variant group-hover:text-primary">
                north_east
              </span>
            </div>
            <h3 className="font-jakarta text-label-lg text-on-surface mb-1">{space.name}</h3>
            <p className="text-body-sm text-secondary">Workspace space</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
