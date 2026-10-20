'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import clsx from 'clsx'
import { checkAgentHealth, isLlmReady, llmStatusLabel } from '@/lib/agent'
import { signOutAction } from '@/lib/auth/actions'
import { dispatchOpenCommandBar } from '@/lib/workspace/open-command-bar'
import GlobalSearchBar from '@/components/v2/GlobalSearchBar'
import { useShell } from '@/components/v2/shell/ShellContext'

function breadcrumbLabel(pathname: string): { section: string; page: string } {
  if (pathname === '/') return { section: 'Overview', page: 'Needs you' }
  if (pathname.startsWith('/workspace')) return { section: 'Workspace', page: 'Space' }
  if (pathname === '/school') return { section: 'School', page: 'Workspace' }
  if (pathname === '/work') return { section: 'Work', page: 'Workspace' }
  if (pathname === '/personal') return { section: 'Personal', page: 'Workspace' }
  if (pathname.startsWith('/spaces/')) {
    const slug = pathname.split('/')[2]
    return { section: 'Spaces', page: slug ?? 'Space' }
  }
  if (pathname === '/setup') return { section: 'Connected Life', page: 'Setup' }
  if (pathname === '/settings') return { section: 'Settings', page: 'Device' }
  if (pathname === '/onboarding') return { section: 'Onboarding', page: 'Welcome' }
  const tail = pathname.split('/').filter(Boolean)[0] ?? 'App'
  return { section: tail.charAt(0).toUpperCase() + tail.slice(1), page: 'Page' }
}

export default function TopNav() {
  const pathname = usePathname()
  const { setMobileOpen } = useShell()
  const [apiOnline, setApiOnline] = useState(false)
  const [aiLabel, setAiLabel] = useState('AI offline')
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)

  const crumbs = breadcrumbLabel(pathname ?? '/')

  useEffect(() => {
    const sync = (h: Awaited<ReturnType<typeof checkAgentHealth>>) => {
      setApiOnline(isLlmReady(h))
      setAiLabel(isLlmReady(h) ? llmStatusLabel(h) : 'AI offline')
    }
    checkAgentHealth().then(sync)
    const interval = setInterval(() => checkAgentHealth().then(sync), 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="sticky top-0 z-30 bg-surface-container-lowest/90 backdrop-blur-md border-b border-border-serenity px-3 md:px-5 py-2.5 flex items-center gap-3 flex-shrink-0">
      <button
        type="button"
        className="lg:hidden w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
      >
        <span className="material-symbols-outlined">menu</span>
      </button>

      <div className="hidden md:flex items-center gap-2 text-body-sm text-secondary shrink-0 min-w-[140px]">
        <span className="material-symbols-outlined text-[18px]">dock_to_right</span>
        <span className="text-on-surface-variant">{crumbs.section}</span>
        <span>/</span>
        <span className="text-on-surface font-medium">{crumbs.page}</span>
      </div>

      <GlobalSearchBar />

      <div className="flex items-center gap-2 shrink-0 ml-auto">
        <Link
          href="/"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border-serenity bg-surface-container-low px-3 py-2 text-body-sm font-jakarta font-semibold text-on-surface hover:bg-surface-container"
        >
          Overview
        </Link>

        <button
          type="button"
          onClick={() => dispatchOpenCommandBar()}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border-serenity bg-surface-container-low px-3 py-2 text-body-sm font-jakarta font-semibold text-on-surface hover:bg-surface-container"
        >
          Ask Athera
          <kbd className="rounded border border-border-serenity bg-surface-container-lowest px-1 text-[10px] font-medium text-secondary">
            ⌘K
          </kbd>
        </button>

        <div
          className={clsx(
            'hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-jakarta font-medium max-w-[160px]',
            apiOnline
              ? 'bg-primary-fixed/40 border-primary-fixed-dim/50 text-primary'
              : 'bg-surface-container border-border-serenity text-on-surface-variant'
          )}
          title={aiLabel}
        >
          <span
            className={clsx(
              'w-1.5 h-1.5 rounded-full shrink-0',
              apiOnline ? 'bg-primary-container animate-pulse' : 'bg-outline-variant'
            )}
          />
          <span className="truncate">{apiOnline ? aiLabel : 'AI offline'}</span>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setAccountMenuOpen((o) => !o)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
            aria-label="Account and settings"
            aria-expanded={accountMenuOpen}
            aria-haspopup="menu"
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </button>
          {accountMenuOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40"
                aria-label="Close account menu"
                onClick={() => setAccountMenuOpen(false)}
              />
              <div
                role="menu"
                className="absolute right-0 top-full mt-1 z-50 w-52 rounded-xl border border-border-serenity bg-surface-container-lowest shadow-serenity-lg py-1"
              >
                <Link
                  href="/settings"
                  role="menuitem"
                  className="flex items-center gap-2 px-3 py-2.5 text-body-sm text-on-surface hover:bg-surface-container"
                  onClick={() => setAccountMenuOpen(false)}
                >
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                    tune
                  </span>
                  Device settings
                </Link>
                <Link
                  href="/workspace/settings"
                  role="menuitem"
                  className="flex items-center gap-2 px-3 py-2.5 text-body-sm text-on-surface hover:bg-surface-container"
                  onClick={() => setAccountMenuOpen(false)}
                >
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                    person
                  </span>
                  Account &amp; calendar
                </Link>
                <div className="my-1 border-t border-border-serenity/60" />
                <form action={signOutAction} role="none">
                  <button
                    type="submit"
                    role="menuitem"
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-body-sm text-on-surface hover:bg-surface-container"
                  >
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                      logout
                    </span>
                    Sign out
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
