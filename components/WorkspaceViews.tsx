'use client'

import Link from 'next/link'
import DummyControl from '@/components/DummyControl'

const dummyViews = ['Today', 'This week', 'Tasks', 'Notes', 'Calendar']

export default function WorkspaceViews() {
  return (
    <div className="card-vellum p-4 h-full w-full min-h-0 min-w-0 flex flex-col overflow-hidden">
      <div className="label-caps mb-3 flex-shrink-0">Workspace Views</div>
      <div className="space-y-0.5 flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        {dummyViews.map((label) => (
          <DummyControl
            key={label}
            as="button"
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left"
          >
            <span className="text-sm text-ink-secondary">{label}</span>
          </DummyControl>
        ))}

        <Link
          href="/settings"
          className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-container transition-colors group"
        >
          <span className="text-sm text-ink-secondary group-hover:text-ink-primary">Settings</span>
        </Link>
      </div>
    </div>
  )
}
