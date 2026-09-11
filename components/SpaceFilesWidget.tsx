'use client'

import { useEffect, useState } from 'react'
import { usePendingFiles } from '@/components/PendingFilesContext'
import type { Space, SpaceFile } from '@/lib/types'

function isEmailItem(f: SpaceFile): boolean {
  return f.path.startsWith('gmail://') || Boolean(f.email)
}

export default function SpaceFilesWidget({ spaceSlug }: { spaceSlug: string }) {
  const [files, setFiles] = useState<SpaceFile[]>([])
  const [spaceName, setSpaceName] = useState('')
  const { lastAddedSlug } = usePendingFiles()

  useEffect(() => {
    const load = () => {
      fetch('/api/spaces')
        .then((r) => r.json())
        .then((data: { spaces: Space[] }) => {
          const match = data.spaces.find((s) => s.slug === spaceSlug)
          setFiles(match?.files ?? [])
          setSpaceName(match?.name ?? spaceSlug)
        })
        .catch(() => setFiles([]))
    }
    load()
    const interval = setInterval(load, 2000)
    return () => clearInterval(interval)
  }, [spaceSlug, lastAddedSlug])

  if (files.length === 0) return null

  return (
    <div className="card-vellum p-5 border-l-2 border-l-ochre">
      <div className="flex items-center justify-between mb-3">
        <div className="label-caps text-ochre">Files in {spaceName}</div>
        <span className="text-[10px] text-ink-faint">{files.length} items</span>
      </div>
      <div className="space-y-1 max-h-[200px] overflow-y-auto">
        {files.map((f) => {
          if (isEmailItem(f) && f.email) {
            return (
              <a
                key={f.path}
                href={f.email.gmailUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-2 py-1.5 rounded bg-surface-container text-xs hover:bg-ochre-light/50 transition-colors"
              >
                <span>📧</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-ink-primary">{f.email.subject}</div>
                  <div className="truncate text-[10px] text-ink-faint">
                    {f.email.from} · {f.email.date}
                  </div>
                </div>
                <span className="text-[9px] text-ochre bg-ochre-light px-1.5 py-0.5 rounded flex-shrink-0">
                  Gmail
                </span>
              </a>
            )
          }

          return (
            <div
              key={f.path}
              className="flex items-center gap-2 px-2 py-1.5 rounded bg-surface-container text-xs"
            >
              <span>{f.isDirectory ? '📁' : '📄'}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-ink-primary">{f.name}</div>
                <div className="truncate text-[10px] text-ink-faint font-mono">{f.path}</div>
              </div>
              <span className="text-[9px] text-ochre bg-ochre-light px-1.5 py-0.5 rounded flex-shrink-0">
                {f.source}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
