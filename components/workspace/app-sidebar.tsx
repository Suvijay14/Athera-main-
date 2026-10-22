'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronDown, ChevronRight, FileText, Menu, X } from 'lucide-react'
import { useEffect, useMemo, useState, useTransition } from 'react'

import {
  archiveSpaceAction,
  createSpaceAction,
  renameSpaceAction,
  unarchiveSpaceAction,
} from '@/app/workspace/space-actions'
import { signOutAction } from '@/lib/auth/actions'
import type { Entity, Space } from '@/lib/db/schemas'
import { entityNavInitial, groupEntitiesBySpace } from '@/lib/workspace/compute-quiet-entity-ids'
import {
  buildChildSpacesByParentId,
  spaceNavInitial,
  topLevelSpaces,
} from '@/lib/workspace/space-hierarchy'
import { entityDisplayColor, spaceDisplayColor } from '@/lib/workspace/space-display-color'
import { spaceEntityHref, spaceListHref } from '@/lib/workspace/home-route'
import { SPACE_COLOR_SWATCHES, SPACE_ICON_OPTIONS } from '@/lib/workspace/space-icons'
import { cn } from '@/lib/utils'

type AppSidebarProps = {
  spaces: Space[]
  entities: Entity[]
  itemCountsBySpace: Record<string, number>
  quietEntityIds: string[]
  userEmail?: string
  workspaceName: string
  mobileOpen: boolean
  onMobileOpenChange: (open: boolean) => void
}

const navLinkClass = (active: boolean) =>
  cn(
    'block rounded-lg px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40',
    active
      ? 'bg-surface-container text-ink-primary'
      : 'text-ink-secondary hover:bg-surface-container/70 hover:text-ink-primary'
  )

const subLinkClass = (active: boolean) =>
  cn(
    'flex min-w-0 items-center gap-2 rounded-md py-1.5 pl-9 pr-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40',
    active ? 'bg-surface-container text-ink-primary font-medium' : 'text-ink-muted hover:bg-surface-container/60'
  )

export function AppSidebar({
  spaces,
  entities,
  itemCountsBySpace,
  quietEntityIds,
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
  const childSpacesByParent = useMemo(() => buildChildSpacesByParentId(spaces), [spaces])
  const spaceById = useMemo(() => new Map(spaces.map((s) => [s.id, s])), [spaces])

  useEffect(() => {
    setExpandedSpaceIds((prev) => {
      const next = new Set(prev)
      for (const space of topLevelSpaces(spaces)) {
        const hasChildren =
          (childSpacesByParent.get(space.id)?.length ?? 0) > 0 ||
          (entitiesBySpace.get(space.id)?.length ?? 0) > 0
        if (hasChildren) {
          next.add(space.id)
        }
      }
      return next
    })
  }, [spaces, entitiesBySpace, childSpacesByParent])
  const activeSpaces = topLevelSpaces(spaces)
  const archivedSpaces = spaces.filter((s) => s.archivedAt)
  const pasteWeekHref = '/workspace/paste-week'

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
    <div className="flex h-full flex-col bg-canvas-base text-ink-primary">
      <div className="border-b border-border-delicate px-4 py-4">
        <div className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-primary text-sm font-semibold text-white"
            aria-hidden
          >
            A
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-primary">Athera</p>
            <p className="truncate text-sm text-ink-muted">{workspaceName}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Workspace">
        <Link
          href="/workspace/overview"
          onClick={closeMobile}
          className={navLinkClass(pathname === '/workspace/overview')}
        >
          Overview
        </Link>
        <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
          Spaces
        </p>
        <ul className="space-y-0.5">
          {activeSpaces.map((space) => {
            const href = spaceListHref(space.id)
            const spaceActive = pathname === href || pathname.startsWith(`${href}/`)
            const count = itemCountsBySpace[space.id] ?? 0
            const childSpaces = childSpacesByParent.get(space.id) ?? []
            const spaceEntities = entitiesBySpace.get(space.id) ?? []
            const expanded = expandedSpaceIds.has(space.id)
            const hasNested = childSpaces.length > 0 || spaceEntities.length > 0

            return (
              <li key={space.id}>
                <div className="flex items-center gap-0.5">
                  {hasNested ? (
                    <button
                      type="button"
                      className="rounded p-1 text-ink-faint hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40"
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
                      'flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40',
                      spaceActive
                        ? 'bg-surface-container font-medium text-ink-primary'
                        : 'text-ink-secondary hover:bg-surface-container/70'
                    )}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: spaceDisplayColor(space) }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate">{space.name}</span>
                    <span className="text-xs tabular-nums text-ink-faint">{count}</span>
                  </Link>
                </div>
                {hasNested && expanded ? (
                  <ul className="mt-0.5 space-y-0.5 pb-1">
                    {childSpaces.length > 0
                      ? childSpaces.map((child) => {
                          const childHref = spaceListHref(child.id)
                          const childActive =
                            pathname === childHref || pathname.startsWith(`${childHref}/`)
                          const childEntity = entities.find((e) => e.spaceId === child.id)
                          const initial = spaceNavInitial(child.name)
                          const isQuiet = childEntity ? quietSet.has(childEntity.id) : false
                          return (
                            <li key={child.id}>
                              <Link
                                href={childHref}
                                onClick={closeMobile}
                                className={subLinkClass(childActive)}
                              >
                                <span
                                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                                  style={{ backgroundColor: spaceDisplayColor(child) }}
                                  aria-hidden
                                >
                                  {initial}
                                </span>
                                <span className="min-w-0 flex-1 truncate">{child.name}</span>
                                {isQuiet ? (
                                  <span className="shrink-0 text-[11px] lowercase text-red-600/80">
                                    quiet
                                  </span>
                                ) : null}
                              </Link>
                            </li>
                          )
                        })
                      : spaceEntities.map((entity) => {
                          const entityHref = spaceEntityHref(space.id, entity.id)
                          const entityActive =
                            pathname === entityHref || pathname.startsWith(`${entityHref}/`)
                          const initial = entityNavInitial(entity.name)
                          return (
                            <li key={entity.id}>
                              <Link
                                href={entityHref}
                                onClick={closeMobile}
                                className={subLinkClass(entityActive)}
                              >
                                <span
                                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                                  style={{
                                    backgroundColor: entityDisplayColor(
                                      entity,
                                      spaceById.get(entity.spaceId)
                                    ),
                                  }}
                                  aria-hidden
                                >
                                  {initial}
                                </span>
                                <span className="min-w-0 flex-1 truncate">{entity.name}</span>
                                {quietSet.has(entity.id) ? (
                                  <span className="shrink-0 text-[11px] lowercase text-red-600/80">
                                    quiet
                                  </span>
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
          <div className="mt-2 space-y-2 rounded-lg border border-border-delicate bg-surface-paper p-3">
            <input
              className="w-full rounded-md border border-border-delicate bg-white px-2 py-1.5 text-sm text-ink-primary placeholder:text-ink-faint"
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
                    'rounded p-1.5 text-ink-muted',
                    newIcon === id ? 'bg-surface-container ring-1 ring-border-subtle' : 'hover:bg-surface-container/80'
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
                    newColor === c && 'ring-2 ring-offset-1 ring-offset-canvas-base ring-ink-primary/30'
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
                className="rounded-md bg-ink-primary px-2 py-1 text-xs font-medium text-white"
                onClick={submitNewSpace}
              >
                Create
              </button>
              <button
                type="button"
                className="rounded-md px-2 py-1 text-xs text-ink-muted"
                onClick={() => setAdding(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm text-ink-muted hover:bg-surface-container/70"
            onClick={() => setAdding(true)}
          >
            Add a space
          </button>
        )}
        <button
          type="button"
          className="mt-3 w-full px-3 text-left text-xs text-ink-faint hover:text-ink-muted"
          onClick={() => setShowArchived((v) => !v)}
        >
          {showArchived ? 'Hide archived spaces' : 'Show archived spaces'}
        </button>
        {showArchived && archivedSpaces.length > 0 ? (
          <ul className="mt-1 space-y-0.5">
            {archivedSpaces.map((space) => (
              <li
                key={space.id}
                className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-ink-faint"
              >
                <span className="truncate">{space.name}</span>
                <button
                  type="button"
                  className="text-xs text-terracotta hover:underline"
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

        <div className="my-3 border-t border-border-delicate" role="presentation" />

        <Link href="/workspace/changes" onClick={closeMobile} className={navLinkClass(pathname === '/workspace/changes')}>
          Change history
        </Link>
        <Link
          href={pasteWeekHref}
          onClick={closeMobile}
          className={cn(navLinkClass(pathname === pasteWeekHref || pathname.startsWith(`${pasteWeekHref}/`)), 'flex items-center gap-2')}
        >
          <FileText size={16} className="shrink-0 opacity-70" aria-hidden />
          Paste your week
        </Link>
        <button
          type="button"
          disabled
          title="Interactive tour coming soon"
          className="mt-1 block w-full cursor-not-allowed rounded-lg px-3 py-2 text-left text-sm font-medium text-ink-faint opacity-70"
        >
          Play the demo
        </button>

        <div
          className="mx-2 mt-4 rounded-lg border border-border-delicate bg-surface-paper/80 p-3"
          aria-label="Coming soon"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">Coming soon</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">
            Today brief · Meeting prep · Weekly recap
          </p>
        </div>

        {process.env.NODE_ENV === 'development' ? (
          <>
            <div className="my-3 border-t border-border-delicate" role="presentation" />
            <Link
              href="/components"
              onClick={closeMobile}
              className={navLinkClass(pathname === '/components' || pathname.startsWith('/components/'))}
            >
              Components lab
            </Link>
          </>
        ) : null}
      </nav>
      <div className="space-y-1 border-t border-border-delicate px-3 py-3">
        {process.env.NODE_ENV === 'development' ? (
          <Link
            href="/workspace/admin/metrics"
            onClick={closeMobile}
            className="block rounded-lg px-2 py-2 text-sm text-ink-muted hover:bg-surface-container/70"
          >
            Metrics
          </Link>
        ) : null}
        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full rounded-lg px-2 py-2 text-left text-sm text-ink-muted hover:bg-surface-container/70"
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
        className="fixed left-3 top-3 z-30 rounded-lg border border-border-delicate bg-surface-paper p-2 text-ink-primary shadow-card md:hidden"
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
          'fixed inset-y-0 left-0 z-50 w-[260px] border-r border-border-delicate bg-canvas-base transition-transform md:static md:translate-x-0 md:shrink-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex items-center justify-end p-2 md:hidden">
          <button
            type="button"
            className="text-ink-muted"
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
