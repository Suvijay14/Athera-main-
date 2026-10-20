'use client'

import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'

import { useWorkspaceCommandActionsContext } from '@/components/workspace/workspace-command-actions-context'
import { useWorkspaceUi } from '@/components/workspace/workspace-ui-context'
import type { CommandBarSubmitRow } from '@/lib/workspace/command-bar-submit'
import type { Entity, FieldDefinition, Space, ViewDefinition } from '@/lib/db/schemas'
import {
  rankCommandBarJumpTargets,
  type CommandBarJumpTarget,
} from '@/lib/workspace/command-bar-search'
import {
  deriveCommandBarChips,
  filterCommandBarChips,
  type CommandBarChip,
} from '@/lib/workspace/command-bar-chips'

type CommandBarItem = {
  id: string
  title: string
  spaceId: string
  startAt: string | null
  dueDate: string | null
}

type CommandBarProps = {
  items: CommandBarItem[]
  spaces: Space[]
  fields: FieldDefinition[]
  views: ViewDefinition[]
  entities: Entity[]
  notePages?: {
    pageId: string
    ownerType: string
    ownerId: string
    bodyText: string
  }[]
}

type Row =
  | { kind: 'chip'; chip: CommandBarChip }
  | { kind: 'jump'; target: CommandBarJumpTarget }
  | { kind: 'create'; label: string }

function isTextInputFocused(): boolean {
  const el = document.activeElement
  if (!el) {
    return false
  }
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.getAttribute('contenteditable') === 'true'
}

function parseSpaceFromPath(pathname: string): { spaceId: string | null; viewId: string | null } {
  const m = /^\/workspace\/spaces\/([^/]+)(?:\/([^/]+))?/.exec(pathname)
  if (!m) {
    return { spaceId: null, viewId: null }
  }
  const viewId = m[2]
  if (viewId && viewId !== 'entities') {
    return { spaceId: m[1]!, viewId }
  }
  return { spaceId: m[1]!, viewId: null }
}

function rowToSubmitRow(row: Row | undefined): CommandBarSubmitRow | null {
  if (!row) {
    return null
  }
  if (row.kind === 'create') {
    return { kind: 'create', label: row.label }
  }
  if (row.kind === 'jump') {
    return { kind: 'jump', target: row.target }
  }
  return { kind: 'chip', requestText: row.chip.requestText ?? null }
}

export function CommandBar({ items, spaces, fields, views, entities, notePages = [] }: CommandBarProps) {
  const pathname = usePathname()
  const {
    commandBarOpen,
    closeCommandBar,
    openCommandBar,
    commandCreateMode,
    commandQuery,
    setCommandQuery,
  } = useWorkspaceUi()
  const { busy, submitQuery, runJump, runViewRequest } = useWorkspaceCommandActionsContext()
  const [activeIndex, setActiveIndex] = useState(0)
  const [inlineMessage, setInlineMessage] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { spaceId: pathSpaceId, viewId: activeViewId } = parseSpaceFromPath(pathname)
  const defaultSpaceId = useMemo(
    () => pathSpaceId ?? spaces.find((s) => s.isDefault)?.id ?? spaces[0]?.id,
    [pathSpaceId, spaces]
  )

  const spaceItems = useMemo(
    () => (defaultSpaceId ? items.filter((i) => i.spaceId === defaultSpaceId) : items),
    [items, defaultSpaceId]
  )

  const spaceEntities = useMemo(
    () => (defaultSpaceId ? entities.filter((e) => e.spaceId === defaultSpaceId) : []),
    [entities, defaultSpaceId]
  )

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey && !isTextInputFocused()) {
        e.preventDefault()
        openCommandBar({ createMode: true })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [openCommandBar])

  useEffect(() => {
    if (commandBarOpen) {
      setActiveIndex(0)
      setInlineMessage(null)
      window.setTimeout(() => inputRef.current?.focus(), 0)
    } else {
      setInlineMessage(null)
    }
  }, [commandBarOpen, commandCreateMode])

  const jumpResults = useMemo(() => {
    const notes = notePages.map((p) => {
      const space = spaces.find((s) =>
        p.ownerType === 'space' ? s.id === p.ownerId : entities.some((e) => e.id === p.ownerId && e.spaceId === s.id)
      )
      const entity =
        p.ownerType === 'entity' ? entities.find((e) => e.id === p.ownerId) : null
      const label =
        p.ownerType === 'space'
          ? `Notes · ${space?.name ?? 'Space'}`
          : `Notes · ${entity?.name ?? 'Entity'}`
      return {
        pageId: p.pageId,
        ownerType: p.ownerType as 'space' | 'entity',
        ownerId: p.ownerId,
        bodyText: p.bodyText,
        label,
      }
    })
    return rankCommandBarJumpTargets({
      query: commandQuery,
      items: items.map((i) => ({ id: i.id, title: i.title })),
      spaces: spaces.map((s) => ({ id: s.id, name: s.name })),
      notes,
    })
  }, [commandQuery, items, spaces, notePages, entities])

  const chips = useMemo(
    () =>
      defaultSpaceId
        ? filterCommandBarChips(
            deriveCommandBarChips({
              spaceItems,
              spaceEntities,
              fields,
              views,
              activeViewId,
            }),
            commandQuery
          )
        : [],
    [defaultSpaceId, spaceItems, spaceEntities, fields, views, activeViewId, commandQuery]
  )

  const rows: Row[] = useMemo(() => {
    const list: Row[] = chips.map((chip) => ({ kind: 'chip', chip }))
    list.push(...jumpResults.map((target) => ({ kind: 'jump' as const, target })))
    const trimmed = commandQuery.trim()
    if (trimmed) {
      list.push({ kind: 'create', label: trimmed })
    }
    return list
  }, [chips, jumpResults, commandQuery])

  const selectRow = useCallback(
    (row: Row) => {
      if (row.kind === 'chip') {
        if (row.chip.action === 'create') {
          setCommandQuery('')
          inputRef.current?.focus()
          return
        }
        if (row.chip.requestText) {
          void runViewRequest(row.chip.requestText)
        }
        return
      }
      if (row.kind === 'jump') {
        runJump(row.target)
        return
      }
      void submitQuery(row.label, { kind: 'create', label: row.label })
    },
    [runJump, runViewRequest, setCommandQuery, submitQuery]
  )

  const handleEnter = useCallback(() => {
    const row = rows[activeIndex]
    void submitQuery(commandQuery, rowToSubmitRow(row))
  }, [activeIndex, commandQuery, rows, submitQuery])

  if (!commandBarOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center px-3 pt-[12vh] sm:px-4">
      <button
        type="button"
        className="absolute inset-0 z-0 bg-neutral-900/40"
        aria-label="Close command bar"
        onClick={closeCommandBar}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command bar"
        className="relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl focus-visible:outline-none"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <form
          className="flex items-center gap-2 border-b border-neutral-200 px-3"
          onSubmit={(e) => {
            e.preventDefault()
            handleEnter()
          }}
        >
          <Search size={18} className="shrink-0 text-neutral-500" aria-hidden />
          <input
            ref={inputRef}
            className="min-w-0 flex-1 py-3 text-sm focus-visible:outline-none"
            placeholder="Search or add a task…"
            value={commandQuery}
            aria-busy={busy}
            onChange={(e) => {
              setCommandQuery(e.target.value)
              setActiveIndex(0)
              setInlineMessage(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault()
                closeCommandBar()
                return
              }
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActiveIndex((i) => Math.min(i + 1, rows.length - 1))
                return
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActiveIndex((i) => Math.max(i - 1, 0))
                return
              }
            }}
          />
          <button
            type="button"
            className="rounded-lg p-1 text-neutral-600 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={closeCommandBar}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </form>
        {busy ? (
          <p className="border-b border-neutral-100 bg-neutral-50 px-4 py-2 text-xs text-neutral-600" role="status">
            Working…
          </p>
        ) : null}
        {inlineMessage ? (
          <p className="border-b border-neutral-100 bg-neutral-50 px-4 py-3 text-sm text-neutral-700" role="status">
            {inlineMessage}
          </p>
        ) : null}
        <ul className="max-h-64 overflow-y-auto py-1" role="listbox">
          {rows.length === 0 ? (
            <li className="px-4 py-3 text-sm text-neutral-500">Type to search, ask for a view, or create.</li>
          ) : (
            rows.map((row, index) => {
              const active = index === activeIndex
              if (row.kind === 'chip') {
                return (
                  <li key={row.chip.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${
                        active ? 'bg-neutral-100' : 'hover:bg-neutral-50'
                      }`}
                      onMouseEnter={() => setActiveIndex(index)}
                      disabled={busy}
                      onClick={() => void selectRow(row)}
                    >
                      <span className="truncate text-neutral-900">{row.chip.label}</span>
                      <span className="shrink-0 text-xs text-neutral-500">Suggestion</span>
                    </button>
                  </li>
                )
              }
              if (row.kind === 'jump') {
                const label =
                  row.target.type === 'item'
                    ? row.target.title
                    : row.target.type === 'space'
                      ? row.target.name
                      : row.target.label
                const typeLabel =
                  row.target.type === 'item'
                    ? 'Item'
                    : row.target.type === 'space'
                      ? 'Space'
                      : 'Note'
                const jumpKey =
                  row.target.type === 'note'
                    ? `note-${row.target.pageId}`
                    : `${row.target.type}-${row.target.type === 'item' ? row.target.id : row.target.id}`
                return (
                  <li key={jumpKey}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${
                        active ? 'bg-neutral-100' : 'hover:bg-neutral-50'
                      }`}
                      onMouseEnter={() => setActiveIndex(index)}
                      disabled={busy}
                      onClick={() => void selectRow(row)}
                    >
                      <span className="truncate text-neutral-900">{label}</span>
                      <span className="shrink-0 text-xs text-neutral-500">{typeLabel}</span>
                    </button>
                  </li>
                )
              }
              return (
                <li key="create">
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={`w-full px-4 py-2.5 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${
                      active ? 'bg-neutral-100' : 'hover:bg-neutral-50'
                    }`}
                    onMouseEnter={() => setActiveIndex(index)}
                    disabled={busy}
                    onClick={() => void selectRow(row)}
                  >
                    Create &ldquo;{row.label}&rdquo;
                  </button>
                </li>
              )
            })
          )}
        </ul>
      </div>
    </div>
  )
}
