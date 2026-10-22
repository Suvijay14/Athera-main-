'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, Search } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'

import { useWorkspaceCommandActionsContext } from '@/components/workspace/workspace-command-actions-context'
import { useWorkspaceUi } from '@/components/workspace/workspace-ui-context'
import type { Space } from '@/lib/db/schemas'
import { displayNameFromEmail } from '@/lib/workspace/overview-display-name'
import { cn } from '@/lib/utils'

type WorkspaceTopBarProps = {
  spaces: Space[]
  userEmail?: string
}

function breadcrumb(pathname: string, spaces: Space[]): string {
  const overview =
    pathname === '/workspace/overview' || pathname === '/workspace'
  if (overview) {
    return 'Overview'
  }
  if (pathname === '/workspace/changes') {
    return 'Change history'
  }
  if (pathname === '/workspace/paste-week' || pathname.startsWith('/workspace/paste-week/')) {
    return 'Paste your week'
  }
  const spaceMatch = /^\/workspace\/spaces\/([^/]+)/.exec(pathname)
  if (spaceMatch) {
    const spaceId = spaceMatch[1]
    const space = spaces.find((s) => s.id === spaceId)
    const entityMatch = /^\/workspace\/spaces\/[^/]+\/entities\/([^/]+)/.exec(pathname)
    if (entityMatch && space) {
      return `Clients / ${space.name}`
    }
    if (space) {
      return `Spaces / ${space.name}`
    }
  }
  return 'Overview'
}

function avatarInitials(email?: string): string {
  const name = displayNameFromEmail(email)
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export function WorkspaceTopBar({ spaces, userEmail }: WorkspaceTopBarProps) {
  const pathname = usePathname() ?? ''
  const inputRef = useRef<HTMLInputElement>(null)
  const { commandQuery, setCommandQuery, openCommandBar, closeCommandBar, commandBarOpen, breadcrumbLabel } =
    useWorkspaceUi()
  const { busy, submitQuery } = useWorkspaceCommandActionsContext()

  const activeSpaces = useMemo(() => spaces.filter((s) => !s.archivedAt), [spaces])
  const crumb = breadcrumbLabel ?? breadcrumb(pathname, activeSpaces)

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
    <header className="sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b border-border-delicate bg-canvas-base/95 px-3 py-2.5 backdrop-blur-sm md:gap-3 md:px-6 md:pl-8">
      <p className="min-w-[88px] shrink-0 text-sm font-medium text-ink-primary">{crumb}</p>

      <form
        className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-border-delicate bg-surface-paper px-3 py-2 focus-within:border-border-subtle focus-within:ring-2 focus-within:ring-terracotta/15"
        onSubmit={(e) => {
          e.preventDefault()
          void submitQuery(commandQuery)
        }}
      >
        <Search size={16} className="shrink-0 text-ink-faint" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          value={commandQuery}
          disabled={busy}
          placeholder="Search or add a task"
          className="min-w-0 flex-1 bg-transparent text-sm text-ink-primary placeholder:text-ink-faint focus-visible:outline-none"
          onChange={(e) => setCommandQuery(e.target.value)}
          onFocus={() => {
            if (!commandBarOpen) {
              openCommandBar()
            }
          }}
          aria-label="Search or add a task"
        />
        <kbd className="hidden shrink-0 rounded border border-border-delicate bg-white px-1.5 py-0.5 text-[10px] font-medium text-ink-faint sm:inline">
          ⌘K
        </kbd>
      </form>

      <button
        type="button"
        onClick={() => openCommandBar()}
        className={cn(
          'shrink-0 rounded-full border border-border-delicate bg-surface-paper px-3 py-2 text-sm font-medium',
          'text-ink-primary hover:bg-surface-container'
        )}
      >
        Ask Athera
      </button>

      <button
        type="button"
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40"
        aria-label="Notifications (coming soon)"
        disabled
      >
        <Bell size={18} />
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-terracotta" aria-hidden />
      </button>

      <Link
        href="/workspace/settings"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-primary text-xs font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40"
        aria-label="Account and settings"
        title={userEmail ?? 'Account'}
      >
        {avatarInitials(userEmail)}
      </Link>
    </header>
  )
}
