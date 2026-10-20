'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'

const PAGES = [
  { title: 'Overview', href: '/', subtitle: 'Dashboard' },
  { title: 'Component lab', href: '/components', subtitle: 'Test CTC ports' },
  { title: 'School workspace', href: '/school', subtitle: 'Space' },
  { title: 'Work workspace', href: '/work', subtitle: 'Space' },
  { title: 'Settings', href: '/settings', subtitle: 'App' },
  { title: 'Setup / integrations', href: '/setup', subtitle: 'Gmail, Canvas, voice' },
  { title: 'Commands matrix', href: '/commands', subtitle: 'Voice tools' },
]

export default function CommandPaletteLab() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const results = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return PAGES
    return PAGES.filter(
      (p) => p.title.toLowerCase().includes(query) || p.subtitle.toLowerCase().includes(query)
    )
  }, [q])

  return (
    <div className="space-y-3">
      <p className="text-body-sm text-secondary">
        Athera-scoped command palette (CTC port). Press{' '}
        <kbd className="px-1.5 py-0.5 rounded bg-surface-container text-xs">⌘K</kbd> or open below.
      </p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border-serenity text-sm"
      >
        <Search size={16} />
        Open command palette
      </button>

      {open && (
        <div className="fixed inset-0 z-[130] flex items-start justify-center pt-[15vh] px-4">
          <button type="button" className="absolute inset-0 bg-inverse-surface/50" aria-label="Close" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-lg card-v2 shadow-serenity-lg overflow-hidden">
            <div className="flex items-center gap-2 px-3 border-b border-border-serenity">
              <Search size={18} className="text-secondary shrink-0" />
              <input
                autoFocus
                className="flex-1 py-3 bg-transparent outline-none text-sm"
                placeholder="Jump to page…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <button type="button" onClick={() => setOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <ul className="max-h-64 overflow-y-auto py-1">
              {results.map((r) => (
                <li key={r.href}>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2.5 hover:bg-surface-container"
                    onClick={() => {
                      setOpen(false)
                      router.push(r.href)
                    }}
                  >
                    <div className="text-sm font-medium text-on-surface">{r.title}</div>
                    <div className="text-xs text-secondary">{r.subtitle}</div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
