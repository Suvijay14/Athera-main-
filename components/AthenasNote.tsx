'use client'

import { useEffect, useState } from 'react'
import DummyControl from '@/components/DummyControl'
import { fetchNote } from '@/lib/api'

export default function AthenasNote({ space }: { space: string }) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNote(space)
      .then((data) => setNote(data.note))
      .catch(() => setNote(''))
      .finally(() => setLoading(false))
  }, [space])

  return (
    <div className="card-vellum p-5 border-l-2 border-l-terracotta">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 rounded-full bg-terracotta-light flex items-center justify-center">
          <span className="text-terracotta text-xs">✦</span>
        </div>
        <span className="label-caps text-terracotta">Athena&apos;s Note</span>
      </div>

      {loading ? (
        <div className="h-12 bg-surface-container-high rounded animate-pulse" />
      ) : note ? (
        <p className="text-sm font-newsreader italic text-ink-secondary leading-relaxed">
          &ldquo;{note}&rdquo;
        </p>
      ) : (
        <p className="text-sm text-ink-faint">No note yet. Connect the API to receive insights.</p>
      )}

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border-delicate">
        <DummyControl className="text-xs text-terracotta ml-auto px-1 py-0.5 rounded">
          Adjust boundary →
        </DummyControl>
      </div>
    </div>
  )
}
