'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { getComponentMeta, isLiveComponent } from '@/lib/components/registry-meta'
import type { ComponentCategory, ComponentId } from '@/lib/components/types'
import { useComponentLab } from '@/lib/hooks/useComponentLab'

type Filter = 'all' | 'pending' | 'approved'

export default function ComponentLabPage() {
  const {
    loading,
    error,
    syncWarning,
    catalog,
    isApproved,
    approve,
    unapprove,
    supabaseConfigured,
  } = useComponentLab()

  const liveCount = catalog.filter((c) => c.implementation === 'live').length
  const plannedCount = catalog.filter((c) => c.implementation === 'planned').length
  const [filter, setFilter] = useState<Filter>('all')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return catalog.filter((c) => {
      if (filter === 'approved') return isApproved(c.id)
      if (filter === 'pending') return !isApproved(c.id)
      return true
    })
  }, [catalog, filter, isApproved])

  const byCategory = useMemo(() => {
    const map = new Map<ComponentCategory, typeof catalog>()
    for (const item of filtered) {
      const list = map.get(item.category) ?? []
      list.push(item)
      map.set(item.category, list)
    }
    return map
  }, [filtered])

  async function toggleApprove(id: ComponentId, approved: boolean) {
    setBusyId(id)
    setActionError(null)
    try {
      if (approved) await unapprove(id)
      else await approve(id)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Action failed')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <header className="space-y-2">
        <h1 className="font-jakarta text-headline-xl text-primary">Component lab</h1>
        <p className="text-body-md text-secondary max-w-2xl">
          Test Cut the Chaos ports and native widgets. Approve a component to unlock it for the
          dashboard <span className="text-on-surface">+</span> picker and pinned sidebar tools.
        </p>
        <p className="text-body-sm text-secondary">
          {liveCount} live · {plannedCount} planned (full CTC port roadmap). Only{' '}
          <span className="text-on-surface font-medium">live</span> components can be approved and
          added to the dashboard.
        </p>
        {!supabaseConfigured && (
          <p className="text-body-sm text-secondary">
            Supabase env not set — approvals persist in localStorage only.
          </p>
        )}
        {syncWarning && (
          <p className="text-body-sm text-secondary">{syncWarning}</p>
        )}
      </header>

      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'approved'] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-body-sm capitalize ${
              filter === f
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading && catalog.length === 0 && (
        <p className="text-secondary text-body-sm">Loading catalog…</p>
      )}
      {loading && catalog.length > 0 && (
        <p className="text-secondary text-body-sm">Syncing approvals…</p>
      )}
      {error && catalog.length === 0 && <p className="text-error text-body-sm">{error}</p>}
      {actionError && <p className="text-error text-body-sm">{actionError}</p>}

      {Array.from(byCategory.entries()).map(([category, items]) => (
        <section key={category} className="space-y-3">
          <h2 className="label-caps text-outline">{category}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((item) => {
              const approved = isApproved(item.id)
              const live = isLiveComponent(item.id)
              return (
                <article key={item.id} className="card-v2 p-4 flex flex-col gap-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-jakarta text-headline-md text-on-surface">{item.title}</h3>
                      <span
                        className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0 ${
                          live
                            ? 'bg-primary-container/30 text-primary'
                            : 'bg-surface-container text-secondary'
                        }`}
                      >
                        {live ? 'live' : 'planned'}
                      </span>
                    </div>
                    <p className="text-body-sm text-secondary mt-1">{item.description}</p>
                    {item.portWave && (
                      <p className="text-[11px] text-secondary mt-1">Wave {item.portWave}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {item.surfaces.map((s) => (
                      <span
                        key={s}
                        className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-surface-container text-secondary"
                      >
                        {s}
                      </span>
                    ))}
                    {item.requiresSupabase && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high">
                        supabase
                      </span>
                    )}
                    {item.requiresGroq && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high">
                        groq
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-auto pt-2">
                    <Link
                      href={`/components/${item.id}`}
                      className="px-3 py-1.5 rounded-xl text-sm bg-surface-container hover:bg-surface-container-high text-on-surface"
                    >
                      Preview
                    </Link>
                    <button
                      type="button"
                      disabled={busyId === item.id || (!live && !approved)}
                      title={!live && !approved ? 'Port this component first (planned)' : undefined}
                      onClick={() => toggleApprove(item.id, approved)}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed ${
                        approved
                          ? 'border border-border-serenity text-secondary hover:bg-surface-container'
                          : 'bg-primary text-on-primary hover:opacity-90'
                      }`}
                    >
                      {busyId === item.id ? '…' : approved ? 'Revoke' : live ? 'Approve' : 'Planned'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ))}

      {getComponentMeta('ctc-command-palette-page') && (
        <p className="text-body-sm text-secondary pb-8">
          Tip: approve page-surface components to pin them under <strong>Pinned tools</strong> in the
          sidebar.
        </p>
      )}
    </div>
  )
}
