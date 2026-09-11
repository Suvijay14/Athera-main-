'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import clsx from 'clsx'
import { SpaceDropZone } from '@/components/FileApprovalWidget'
import type { Space } from '@/lib/types'

export default function SpacesPanel() {
  const pathname = usePathname()
  const router = useRouter()
  const [spaces, setSpaces] = useState<Space[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState('')
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null)

  const load = useCallback(() => {
    fetch('/api/spaces')
      .then((res) => res.json())
      .then((data: { spaces: Space[] }) => {
        setSpaces(data.spaces ?? [])
        setLastUpdated(new Date().toLocaleTimeString())
      })
      .catch(() => setSpaces([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 2000)
    return () => clearInterval(interval)
  }, [load])

  async function handleDelete(e: React.MouseEvent, space: Space) {
    e.preventDefault()
    e.stopPropagation()

    const confirmed = window.confirm(
      `Delete "${space.name}"? This removes the space and its file list (not the files on disk).`
    )
    if (!confirmed) return

    setDeletingSlug(space.slug)
    try {
      const res = await fetch(`/api/spaces/${space.slug}`, { method: 'DELETE' })
      if (!res.ok) return

      setSpaces((prev) => prev.filter((s) => s.slug !== space.slug))
      if (pathname === `/spaces/${space.slug}`) router.push('/')
    } finally {
      setDeletingSlug(null)
    }
  }

  return (
    <div className="card-vellum p-4 border-l-2 border-l-sage">
      <div className="flex items-center justify-between mb-3">
        <div className="label-caps text-sage">Spaces</div>
        <span className="text-[9px] font-semibold text-sage bg-sage-light px-2 py-0.5 rounded-full uppercase">
          Live
        </span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-10 bg-surface-container rounded animate-pulse" />
          ))}
        </div>
      ) : spaces.length === 0 ? (
        <p className="text-xs text-ink-muted leading-relaxed">
          No spaces yet. Say &ldquo;create a space called…&rdquo; or drag files here after listing
          them with Voice.
        </p>
      ) : (
        <div className="space-y-1">
          {spaces.map((space) => {
            const href = `/spaces/${space.slug}`
            const active = pathname === href
            const isDeleting = deletingSlug === space.slug

            return (
              <SpaceDropZone key={space.id} slug={space.slug} name={space.name}>
                <div
                  className={clsx(
                    'group flex items-center rounded-lg transition-colors',
                    active
                      ? 'bg-sage-light text-sage'
                      : 'text-ink-secondary hover:bg-surface-container hover:text-ink-primary'
                  )}
                >
                  <Link
                    href={href}
                    className={clsx(
                      'flex flex-1 items-center justify-between min-w-0 px-3 py-2',
                      active && 'font-medium'
                    )}
                  >
                    <div className="min-w-0">
                      <div className="text-sm truncate">{space.name}</div>
                      <div className="text-[10px] text-ink-faint mt-0.5">
                        {space.files.length} file{space.files.length === 1 ? '' : 's'} ·{' '}
                        {space.source}
                      </div>
                    </div>
                    <span className="text-[10px] text-ink-faint flex-shrink-0 ml-2 group-hover:hidden">
                      →
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, space)}
                    disabled={isDeleting}
                    title={`Delete ${space.name}`}
                    className={clsx(
                      'flex-shrink-0 mr-2 p-1.5 rounded-md text-ink-faint',
                      'opacity-0 group-hover:opacity-100 focus:opacity-100',
                      'hover:bg-red-50 hover:text-red-600 transition-all',
                      isDeleting && 'opacity-50 cursor-wait'
                    )}
                  >
                    {isDeleting ? (
                      <span className="text-xs">…</span>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-3.5 h-3.5"
                        aria-hidden
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </SpaceDropZone>
            )
          })}
        </div>
      )}

      <p className="text-[10px] text-ink-faint mt-3 pt-3 border-t border-border-delicate">
        Drop file widget here · updated {lastUpdated || '—'}
      </p>
    </div>
  )
}
