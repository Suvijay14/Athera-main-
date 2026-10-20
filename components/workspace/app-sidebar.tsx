'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronDown, ChevronRight, Menu, X } from 'lucide-react'
import { useMemo, useState, useTransition } from 'react'

import {
  archiveSpaceAction,
  createSpaceAction,
  renameSpaceAction,
  unarchiveSpaceAction,
} from '@/app/workspace/space-actions'
import { signOutAction } from '@/lib/auth/actions'
import type { Entity, Space } from '@/lib/db/schemas'
import { entityNavInitial, groupEntitiesBySpace } from '@/lib/workspace/compute-quiet-entity-ids'
import { spaceEntityHref, spaceListHref } from '@/lib/workspace/home-route'
import {
  SPACE_COLOR_SWATCHES,
  SPACE_ICON_OPTIONS,
  spaceIconComponent,
} from '@/lib/workspace/space-icons'
import { cn } from '@/lib/utils'

type AppSidebarProps = {
  spaces: Space[]
  entities: Entity[]
  itemCountsBySpace: Record<string, number>
  quietEntityIds: string[]
  defaultSpaceId: string
  userEmail?: string
  workspaceName: string
  mobileOpen: boolean
  onMobileOpenChange: (open: boolean) => void
}

const navLinkClass = (active: boolean) =>
  cn(
    'block rounded-lg px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed',
    active
      ? 'bg-primary-container text-on-primary'
      : 'text-on-primary-container hover:bg-primary-container/60 hover:text-on-primary'
  )

const subLinkClass = (active: boolean) =>
  cn(
    'flex min-w-0 items-center gap-2 rounded-md py-1.5 pl-9 pr-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed',
    active ? 'bg-primary-container/80 text-on-primary' : 'text-on-primary-container/90 hover:bg-primary-container/40'
  )

export function AppSidebar({
  spaces,
  entities,
  itemCountsBySpace,
  quietEntityIds,
  defaultSpaceId,
  userEmail,
  workspaceName,
  mobileOpen,
  onMobileOpenChange,
}: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [showArchived, setShowArchived] = useState(false)
  const [expandedSpaceIds, setExpandedSpaceIds] = useState<Set<string>>(() => new Set())
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState(SPACE_ICON_OPTIONS[0]?.id ?? 'folder')
  const [newColor, setNewColor] = useState<string>(SPACE_COLOR_SWATCHES[0])
  const [pending, startTransition] = useTransition()

  const quietSet = useMemo(() => new Set(quietEntityIds), [quietEntityIds])
  const entitiesBySpace = useMemo(() => groupEntitiesBySpace(entities), [entities])
  const activeSpaces = spaces.filter((s) => !s.archivedAt)
  const archivedSpaces = spaces.filter((s) => s.archivedAt)
  const pasteWeekHref = `${spaceListHref(defaultSpaceId)}?pasteWeek=1`

  function closeMobile() {
    onMobileOpenChange(false)
  }

  function toggleSpaceExpanded(spaceId: string) {
    setExpandedSpaceIds((prev) => {
      const next = new Set(prev)
      if (next.has(spaceId)) {
        next.delete(spaceId)
      } else {
        next.add(spaceId)
      }
      return next
    })
  }

  function submitNewSpace() {
    const name = newName.trim()
    if (!name) {
      return
    }
    startTransition(async () => {
      const result = await createSpaceAction({
        name,
        icon: newIcon,
        color: newColor,
        sortOrder: activeSpaces.length,
      })
      if (!result.ok) {
        window.alert(result.message)
        return
      }
      setNewName('')
      setAdding(false)
      closeMobile()
      router.push(spaceListHref(result.space.id))
      router.refresh()
    })
  }

  const sidebarInner = (
    <div className="flex h-full flex-col bg-primary text-on-primary">
      <div className="border-b border-white/10 px-4 py-4">
        <p className="text-sm font-semibold text-on-primary">Athera</p>
        <p className="truncate text-sm font-medium text-on-primary-container">{workspaceName}</p>
        <p className="mt-0.5 text-xs text-on-primary-container/80">Life, in context</p>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Workspace">
        <Link
          href="/workspace/overview"
          onClick={closeMobile}
          className={navLinkClass(pathname === '/workspace/overview')}
        >
          Overview
        </Link>
        <p className="px-3 pb-1 pt-4 text-xs font-medium uppercase tracking-wide text-on-primary-container/70">
          Spaces
        </p>
        <ul className="space-y-0.5">
          {activeSpaces.map((space) => {
            const href = spaceListHref(space.id)
            const spaceActive = pathname === href || pathname.startsWith(`${href}/`)
            const Icon = spaceIconComponent(space.icon)
            const count = itemCountsBySpace[space.id] ?? 0
            const spaceEntities = entitiesBySpace.get(space.id) ?? []
            const expanded = expandedSpaceIds.has(space.id)
            const hasEntities = spaceEntities.length > 0

            return (
              <li key={space.id}>
                <div className="flex items-center gap-0.5">
                  {hasEntities ? (
                    <button
                      type="button"
                      className="rounded p-1 text-on-primary-container hover:bg-primary-container/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed"
                      aria-expanded={expanded}
                      aria-label={expanded ? `Collapse ${space.name}` : `Expand ${space.name}`}
                      onClick={() => toggleSpaceExpanded(space.id)}
                    >
                      {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                  ) : (
                    <span className="w-[22px]" aria-hidden />
                  )}
                  <Link
                    href={href}
                    onClick={closeMobile}
                    className={cn(
                      'flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed',
                      spaceActive
                        ? 'bg-primary-container font-medium text-on-primary'
                        : 'text-on-primary-container hover:bg-primary-container/60 hover:text-on-primary'
                    )}
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/10"
                      style={{ color: space.color ?? '#90b9a2' }}
                    >
                      <Icon size={16} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1 truncate">{space.name}</span>
                    <span className="text-xs tabular-nums text-on-primary-container/80">{count}</span>
                  </Link>
                </div>
                {hasEntities && expanded ? (
                  <ul className="mt-0.5 space-y-0.5 pb-1">
                    {spaceEntities.map((entity) => {
                      const entityHref = spaceEntityHref(space.id, entity.id)
                      const entityActive = pathname === entityHref || pathname.startsWith(`${entityHref}/`)
                      const initial = entityNavInitial(entity.name)
                      return (
                        <li key={entity.id}>
                          <Link href={entityHref} onClick={closeMobile} className={subLinkClass(entityActive)}>
                            <span
                              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-on-primary"
                              style={{ backgroundColor: entity.color ?? '#244a38' }}
                              aria-hidden
                            >
                              {initial}
                            </span>
                            <span className="min-w-0 flex-1 truncate">{entity.name}</span>
                            {quietSet.has(entity.id) ? (
                              <span className="shrink-0 text-[11px] text-on-primary-container/70">Quiet</span>
                            ) : null}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                ) : null}
              </li>
            )
          })}
        </ul>
        {adding ? (
          <div className="mt-2 space-y-2 rounded-lg border border-white/15 bg-primary-container/30 p-3">
            <input
              className="w-full rounded-md border border-white/20 bg-primary px-2 py-1.5 text-sm text-on-primary placeholder:text-on-primary-container/60"
              placeholder="Space name"
              value={newName}
              autoFocus
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  submitNewSpace()
                }
              }}
            />
            <div className="flex flex-wrap gap-1">
              {SPACE_ICON_OPTIONS.map(({ id, Icon, label }) => (
                <button
                  key={id}
                  type="button"
                  title={label}
                  className={cn(
                    'rounded p-1.5 text-on-primary-container',
                    newIcon === id ? 'bg-white/15 ring-1 ring-white/40' : 'hover:bg-white/10'
                  )}
                  onClick={() => setNewIcon(id)}
                >
                  <Icon size={14} />
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {SPACE_COLOR_SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={cn(
                    'h-6 w-6 rounded-full border border-white/20',
                    newColor === c && 'ring-2 ring-offset-1 ring-offset-primary ring-white/50'
                  )}
                  style={{ backgroundColor: c }}
                  onClick={() => setNewColor(c)}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pending}
                className="rounded-md bg-primary-container px-2 py-1 text-xs font-medium text-on-primary"
                onClick={submitNewSpace}
              >
                Create
              </button>
              <button
                type="button"
                className="rounded-md px-2 py-1 text-xs text-on-primary-container"
                onClick={() => setAdding(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm text-on-primary-container hover:bg-primary-container/40"
            onClick={() => setAdding(true)}
          >
            + Add a space
          </button>
        )}
        <button
          type="button"
          className="mt-3 w-full px-3 text-left text-xs text-on-primary-container/70 hover:text-on-primary-container"
          onClick={() => setShowArchived((v) => !v)}
        >
          {showArchived ? 'Hide archived spaces' : 'Show archived spaces'}
        </button>
        {showArchived && archivedSpaces.length > 0 ? (
          <ul className="mt-1 space-y-0.5">
            {archivedSpaces.map((space) => (
              <li
                key={space.id}
                className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-on-primary-container/70"
              >
                <span className="truncate">{space.name}</span>
                <button
                  type="button"
                  className="text-xs text-primary-fixed hover:underline"
                  onClick={() => {
                    startTransition(async () => {
                      await unarchiveSpaceAction({ spaceId: space.id })
                      router.refresh()
                    })
                  }}
                >
                  Restore
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="my-3 border-t border-white/10" role="presentation" />

        <Link href="/workspace/changes" onClick={closeMobile} className={navLinkClass(pathname === '/workspace/changes')}>
          Change history
        </Link>
        <Link
          href={pasteWeekHref}
          onClick={closeMobile}
          className={navLinkClass(pathname.includes('pasteWeek=1') || pathname.includes('paste-week'))}
        >
          Paste your week
        </Link>

        <div className="my-3 border-t border-white/10" role="presentation" />

        <Link
          href="/components"
          onClick={closeMobile}
          className={navLinkClass(pathname === '/components' || pathname.startsWith('/components/'))}
        >
          <span className="block">Components</span>
          <span className="block text-xs font-normal text-on-primary-container/80">Lab &amp; approvals</span>
        </Link>
      </nav>
      <div className="space-y-1 border-t border-white/10 px-3 py-3">
        <Link
          href="/workspace/admin/metrics"
          onClick={closeMobile}
          className="block rounded-lg px-2 py-2 text-sm text-on-primary-container hover:bg-primary-container/40"
        >
          Metrics
        </Link>
        <Link
          href="/workspace/settings"
          onClick={closeMobile}
          className="block rounded-lg px-2 py-2 text-sm text-on-primary-container hover:bg-primary-container/40"
        >
          Account &amp; billing
        </Link>
        {userEmail ? (
          <p className="truncate px-2 text-xs text-on-primary-container/60">{userEmail}</p>
        ) : null}
        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full rounded-lg px-2 py-2 text-left text-sm text-on-primary-container hover:bg-primary-container/40"
          >
            Log out
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <>
      <button
        type="button"
        className="fixed left-3 top-3 z-30 rounded-lg border border-primary-container bg-primary p-2 text-on-primary md:hidden"
        aria-label="Open menu"
        onClick={() => onMobileOpenChange(true)}
      >
        <Menu size={20} />
      </button>
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-neutral-900/40 md:hidden"
          aria-label="Close menu"
          onClick={() => onMobileOpenChange(false)}
        />
      ) : null}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[260px] border-r border-primary-container transition-transform md:static md:translate-x-0 md:shrink-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex items-center justify-end p-2 md:hidden">
          <button
            type="button"
            className="text-on-primary-container"
            aria-label="Close sidebar"
            onClick={() => onMobileOpenChange(false)}
          >
            <X size={20} />
          </button>
        </div>
        {sidebarInner}
      </aside>
    </>
  )
}

export function SidebarSpaceActions({ space }: { space: Space }) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  return (
    <div className="mt-2 flex flex-wrap gap-3">
      <button
        type="button"
        className="text-xs text-neutral-500 hover:text-neutral-800"
        onClick={() => {
          const next = window.prompt('Rename space', space.name)
          if (!next?.trim()) {
            return
          }
          startTransition(async () => {
            await renameSpaceAction({ spaceId: space.id, name: next.trim() })
            router.refresh()
          })
        }}
      >
        Rename
      </button>
      {space.isDefault ? null : (
        <button
          type="button"
          className="text-xs text-neutral-500 hover:text-neutral-800"
          onClick={() => {
            if (!window.confirm(`Archive "${space.name}"? Items stay intact.`)) {
              return
            }
            startTransition(async () => {
              await archiveSpaceAction({ spaceId: space.id })
              router.push('/workspace')
              router.refresh()
            })
          }}
        >
          Archive space
        </button>
      )}
    </div>
  )
}
