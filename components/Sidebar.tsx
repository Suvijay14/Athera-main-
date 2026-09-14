'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import clsx from 'clsx'
import { VoiceSidebarButton } from '@/components/VoiceAssistant'
import { fetchCommandsStatus } from '@/lib/commands'

const navItems = [
  { href: '/', label: 'Overview', icon: '⊞' },
  { href: '/setup', label: 'Voice Setup', icon: '🎙' },
  { href: '/setup', label: 'Connected Life', icon: '⟳', gmailDot: true },
  { href: '/reflections', label: 'Reflections', icon: '≡' },
  { href: '/clipboard', label: 'Clipboard', icon: '📎' },
  { href: '/commands', label: 'Commands', icon: '📋', badge: true },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [untestedCount, setUntestedCount] = useState(0)
  const [gmailConnected, setGmailConnected] = useState(false)

  useEffect(() => {
    const load = () => {
      fetchCommandsStatus().then((data) => {
        if (data) setUntestedCount(data.untested.length)
      })
      fetch('/api/auth/gmail/status')
        .then((res) => res.json())
        .then((data: { connected: boolean }) => setGmailConnected(data.connected))
        .catch(() => setGmailConnected(false))
    }
    load()
    const interval = setInterval(load, 10000)
    return () => clearInterval(interval)
  }, [pathname])

  return (
    <aside className="w-[200px] flex-shrink-0 bg-surface-vellum border-r border-border-delicate flex flex-col">
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-terracotta rounded flex items-center justify-center">
            <span className="text-white text-xs">A</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-ink-primary font-newsreader">Athera</div>
            <div className="label-caps text-[9px]">Notebook</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href && item.label !== 'Connected Life'
          const connectedLifeActive = item.label === 'Connected Life' && pathname === '/setup'

          return (
            <Link
              key={item.label}
              href={item.href}
              className={clsx(
                'flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                active || connectedLifeActive
                  ? 'bg-terracotta-light text-terracotta font-medium'
                  : 'text-ink-muted hover:text-ink-primary hover:bg-surface-container'
              )}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <span className="text-base">{item.icon}</span>
                <span className="truncate">{item.label}</span>
                {item.gmailDot && (
                  <span
                    className={clsx(
                      'w-1.5 h-1.5 rounded-full flex-shrink-0',
                      gmailConnected ? 'bg-sage' : 'bg-ink-faint'
                    )}
                    title={gmailConnected ? 'Gmail connected' : 'Gmail not connected'}
                  />
                )}
              </span>
              {item.badge && untestedCount > 0 && (
                <span className="text-[9px] font-bold bg-surface-container text-ink-muted px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                  {untestedCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <VoiceSidebarButton />
    </aside>
  )
}
