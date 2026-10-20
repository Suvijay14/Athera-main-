'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'athera_lab_import_preview'

type StoredMember = { name: string; role?: string; email?: string; phone?: string; notes?: string }

export default function DocumentLibraryLab() {
  const [members, setMembers] = useState<StoredMember[]>([])
  const [importedAt, setImportedAt] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const data = JSON.parse(raw) as { importedAt?: string; members?: StoredMember[] }
      setMembers(data.members ?? [])
      setImportedAt(data.importedAt ?? null)
    } catch {
      /* ignore */
    }
  }, [])

  return (
    <div className="space-y-4">
      <p className="text-body-sm text-secondary">
        Reads roster rows saved by <strong>Import card (lab)</strong>. In production this would list Supabase
        documents.
      </p>
      {!members.length ? (
        <p className="text-body-sm text-secondary py-6 text-center rounded-xl border border-dashed border-border-serenity">
          No imports yet. Run Import card (lab) first.
        </p>
      ) : (
        <>
          {importedAt && (
            <p className="text-body-sm text-secondary">Last import: {new Date(importedAt).toLocaleString()}</p>
          )}
          <ul className="divide-y divide-border-serenity rounded-xl border border-border-serenity">
            {members.map((m, i) => (
              <li key={m.name + i} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <span className="font-medium text-on-surface">{m.name}</span>
                <span className="text-body-sm text-secondary">
                  {[m.role, m.email].filter(Boolean).join(' · ') || '—'}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
