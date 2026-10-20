'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, Search, Settings } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useWorkspaceCommandActionsContext } from '@/components/workspace/workspace-command-actions-context'
import { useWorkspaceUi } from '@/components/workspace/workspace-ui-context'
import type { Space } from '@/lib/db/schemas'
import { spaceListHref } from '@/lib/workspace/home-route'
import { cn } from '@/lib/utils'

type WorkspaceTopBarProps = {
  spaces: Space[]
}

function scopeLabel(pathname: string, spaces: Space[]): string {
  const m = /^\/workspace\/spaces\/([^/]+)/.exec(pathname)
  if (m) {
    const space = spaces.find((s) => s.id === m[1])
    return space?.name ?? 'This space'
  }
  if (pathname === '/' || pathname === '/workspace/overview' || pathname === '/workspace') {
    return 'All spaces'
  }
  return 'All spaces'
}

export function WorkspaceTopBar({ spaces }: WorkspaceTopBarProps) {
  const pathname = usePathname() ?? ''
  const inputRef = useRef<HTMLInputElement>(null)
  const [scopeOpen, setScopeOpen] = useState(false)
  const { commandQuery, setCommandQuery, openCommandBar, closeCommandBar, commandBarOpen } =
    useWorkspaceUi()
  const { busy, submitQuery } = useWorkspaceCommandActionsContext()

  const activeSpaces = useMemo(() => spaces.filter((s) => !s.archivedAt), [spaces])
  const label = scopeLabel(pathname, activeSpaces)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (commandBarOpen) {
          closeCommandBar()
        } else {
          inputRef.current?.focus()
          openCommandBar()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [closeCommandBar, commandBarOpen, openCommandBar])

  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b border-neutral-200 bg-white/95 px-3 py-2.5 backdrop-blur-sm md:px-5 md:pl-5">
      <div className="relative min-w-[120px] shrink-0">
        <button
          type="button"
          className="flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-expanded={scopeOpen}
          aria-haspopup="listbox"
          onClick={() => setScopeOpen((o) => !o)}
        >
          {label}
          <ChevronDown size={16} className="text-neutral-500" aria-hidden />
        </button>
        {scopeOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-30"
              aria-label="Close scope menu"
              onClick={() => setScopeOpen(false)}
            />
            <ul
              className="absolute left-0 top-full z-40 mt-1 max-h-64 w-52 overflow-y-auto rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
              role="listbox"
            >
              <li>
                <Link
                  href="/workspace/overview"
                  className="block px-3 py-2 text-sm text-neutral-800 hover:bg-neutral-50"
                  onClick={() => setScopeOpen(false)}
                >
                  All spaces
                </Link>
              </li>
              {activeSpaces.map((space) => (
                <li key={space.id}>
                  <Link
                    href={spaceListHref(space.id)}
                    className="block px-3 py-2 text-sm text-neutral-800 hover:bg-neutral-50"
                    onClick={() => setScopeOpen(false)}
                  >
                    {space.name}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>

      <form
        className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
        onSubmit={(e) => {
          e.preventDefault()
          void submitQuery(commandQuery)
        }}
      >
        <Search size={16} className="shrink-0 text-neutral-500" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          value={commandQuery}
          disabled={busy}
          placeholder="Search or add a task…"
          className="min-w-0 flex-1 bg-transparent text-sm text-neutral-900 placeholder:text-neutral-500 focus-visible:outline-none"
          onChange={(e) => setCommandQuery(e.target.value)}
          onFocus={() => {
            if (!commandBarOpen) {
              openCommandBar()
            }
          }}
          aria-label="Search or add a task"
        />
        <kbd className="hidden shrink-0 rounded border border-neutral-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 sm:inline">
          ⌘K
        </kbd>
      </form>

      <button
        type="button"
        onClick={() => openCommandBar()}
        className={cn(
          'shrink-0 rounded-full border border-neutral-200 px-3 py-1.5 text-sm font-medium',
          'text-neutral-800 bg-white hover:bg-neutral-50'
        )}
      >
        Ask Athera
      </button>

      <Link
        href="/workspace/settings"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label="Account and settings"
      >
        <Settings size={18} />
      </Link>
    </header>
  )
}
