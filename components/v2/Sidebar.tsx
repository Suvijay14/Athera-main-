'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import clsx from 'clsx'
import BrandLockup from '@/components/v2/BrandLockup'
import AtheraLogo from '@/components/v2/AtheraLogo'
import SidebarCalendar from '@/components/v2/SidebarCalendar'
import { VoiceSidebarButton } from '@/components/VoiceAssistant'
import { fetchCommandsStatus } from '@/lib/commands'
import { useShell } from '@/components/v2/shell/ShellContext'
import type { CalendarEvent } from '@/lib/types'

const TOOL_LINKS = [
  { href: '/setup', label: 'Connected Life', icon: 'sync', match: '/setup', gmailDot: true },
  { href: '/reflections', label: 'Reflections', icon: 'menu_book' },
  { href: '/clipboard', label: 'Clipboard', icon: 'attach_file' },
  { href: '/commands', label: 'Commands', icon: 'terminal', badge: true },
  { href: '/workspace/changes', label: 'What changed', icon: 'history' },
  { href: '/setup', label: 'Voice Setup', icon: 'mic' },
  { href: '/settings', label: 'Settings', icon: 'settings' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen } = useShell()
  const [toolsOpen, setToolsOpen] = useState(false)
  const [untestedCount, setUntestedCount] = useState(0)
  const [gmailConnected, setGmailConnected] = useState(false)
  const [workspaceSpaces, setWorkspaceSpaces] = useState<
    { id: string; name: string; href: string; icon: string }[]
  >([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const load = useCallback(() => {
    fetchCommandsStatus().then((data) => {
      if (data) setUntestedCount(data.untested.length)
    })
    fetch('/api/auth/gmail/status')
      .then((res) => res.json())
      .then((data: { connected: boolean }) => setGmailConnected(data.connected))
      .catch(() => setGmailConnected(false))
    fetch('/api/workspace/nav')
      .then((res) => (res.ok ? res.json() : { spaces: [] }))
      .then((data: { spaces: { id: string; name: string; href: string; icon: string }[] }) =>
        setWorkspaceSpaces(data.spaces ?? [])
      )
      .catch(() => setWorkspaceSpaces([]))
    fetch('/api/dashboard/home')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { events?: CalendarEvent[] } | null) => setEvents(data?.events ?? []))
      .catch(() => setEvents([]))
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [load, pathname])

  const spaceCount = workspaceSpaces.length

  const navLink = (opts: {
    href: string
    label: string
    icon: string
    active: boolean
    sub?: string
    badge?: number
    dot?: boolean
  }) => (
    <Link
      key={opts.href + opts.label}
      href={opts.href}
      title={collapsed ? opts.label : undefined}
      onClick={() => setMobileOpen(false)}
      className={clsx(
        'flex items-center gap-3 rounded-xl transition-colors',
        collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5',
        opts.active
          ? 'bg-surface-container-lowest shadow-serenity text-primary font-semibold'
          : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
      )}
    >
      <span
        className={clsx(
          'material-symbols-outlined text-[22px] shrink-0',
          opts.active && 'text-primary'
        )}
      >
        {opts.icon}
      </span>
      {!collapsed && (
        <>
          <div className="flex-1 min-w-0">
            <div className="font-jakarta text-label-lg truncate">{opts.label}</div>
            {opts.sub && <div className="text-body-sm text-secondary truncate">{opts.sub}</div>}
          </div>
          {opts.dot && (
            <span
              className={clsx(
                'w-2 h-2 rounded-full shrink-0',
                gmailConnected ? 'bg-primary-container' : 'bg-outline-variant'
              )}
            />
          )}
          {opts.badge != null && opts.badge > 0 && (
            <span className="text-[9px] font-bold bg-surface-container px-1.5 py-0.5 rounded-full">
              {opts.badge}
            </span>
          )}
          {opts.active && <span className="w-2 h-2 rounded-full bg-primary-container shrink-0" />}
        </>
      )}
    </Link>
  )

  const inner = (
    <>
      <div
        className={clsx(
          'flex items-center gap-2 pt-5 pb-3',
          collapsed ? 'flex-col px-2' : 'px-4 justify-between'
        )}
      >
        {collapsed ? (
          <Link href="/" onClick={() => setMobileOpen(false)}>
            <AtheraLogo className="h-8 w-8" />
          </Link>
        ) : (
          <Link href="/" onClick={() => setMobileOpen(false)}>
            <BrandLockup compact />
          </Link>
        )}
        <button
          type="button"
          onClick={toggleCollapsed}
          className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors shrink-0"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="material-symbols-outlined text-[18px]">
            {collapsed ? 'dock_to_right' : 'dock_to_left'}
          </span>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 space-y-1">
        {!collapsed && (
          <div className="flex items-center justify-between px-2 pt-2 pb-1">
            <span className="label-caps text-[10px] text-outline">Spaces</span>
            <span className="text-[10px] text-secondary">{spaceCount}</span>
          </div>
        )}

        {navLink({
          href: '/',
          label: 'Overview',
          icon: 'dashboard',
          active: pathname === '/' || pathname === '/workspace/overview',
          sub: collapsed ? undefined : 'Needs you',
        })}

        {workspaceSpaces.map((space) =>
          navLink({
            href: space.href,
            label: space.name,
            icon: space.icon || 'folder',
            active: pathname === space.href || pathname.startsWith(`${space.href}/`),
            sub: collapsed ? undefined : 'Space',
          })
        )}

        {!collapsed && (
          <button
            type="button"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container mt-1"
            onClick={() => setToolsOpen((o) => !o)}
          >
            <span className="material-symbols-outlined text-[22px]">
              {toolsOpen ? 'expand_less' : 'more_horiz'}
            </span>
            <span className="font-jakarta text-label-lg">More tools</span>
          </button>
        )}

        {!collapsed && toolsOpen &&
          TOOL_LINKS.map((item) => {
            const active =
              pathname === item.href &&
              item.label !== 'Voice Setup' &&
              item.label !== 'Connected Life'
            const connectedLife = item.label === 'Connected Life' && pathname === '/setup'
            return navLink({
              href: item.href,
              label: item.label,
              icon: item.icon,
              active: active || connectedLife,
              badge: item.badge ? untestedCount : undefined,
              dot: item.gmailDot,
            })
          })}
      </nav>

      {!collapsed && <SidebarCalendar events={events} agenda={events} />}

      {collapsed && (
        <div className="px-2 pb-1 flex flex-col gap-1">
          <Link
            href="/setup"
            title="Voice Setup"
            className="flex justify-center p-2 rounded-xl hover:bg-surface-container text-on-surface-variant"
          >
            <span className="material-symbols-outlined">mic</span>
          </Link>
          <Link
            href="/settings"
            title="Settings"
            className="flex justify-center p-2 rounded-xl hover:bg-surface-container text-on-surface-variant"
          >
            <span className="material-symbols-outlined">settings</span>
          </Link>
        </div>
      )}

      <div className="p-2 border-t border-border-serenity mt-auto">
        {!collapsed && (
          <div className="flex items-center justify-between px-2 py-1 mb-1 text-body-sm text-secondary">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
              All spaces synced
            </span>
            <Link href="/setup" className="material-symbols-outlined text-[18px] hover:text-primary">
              help
            </Link>
          </div>
        )}
        <VoiceSidebarButton />
      </div>
    </>
  )

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="lg:hidden fixed inset-0 z-40 bg-inverse-surface/30"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={clsx(
          'flex-shrink-0 bg-surface-container-low border-r border-border-serenity flex flex-col transition-all duration-200 z-50',
          collapsed ? 'w-sidebar-collapsed' : 'w-sidebar',
          'max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:shadow-serenity-lg',
          mobileOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full'
        )}
      >
        {inner}
      </aside>
    </>
  )
}
