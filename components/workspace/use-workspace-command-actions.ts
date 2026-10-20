'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { runCommandViewRequestAction } from '@/app/workspace/command-actions'
import { quickCreateWorkItemAction } from '@/app/workspace/actions'
import { useWorkspaceUi } from '@/components/workspace/workspace-ui-context'
import type { Entity, Space } from '@/lib/db/schemas'
import {
  rankCommandBarJumpTargets,
  type CommandBarJumpTarget,
} from '@/lib/workspace/command-bar-search'
import { decideCommandBarSubmit } from '@/lib/workspace/command-bar-submit'
import {
  spaceEntityHref,
  spaceListHref,
  spaceNotesHref,
  spaceViewHref,
} from '@/lib/workspace/home-route'
import { parseQuickAdd } from '@/lib/workspace/parse-quick-add'
import { quickAddParseToCreatePayload } from '@/lib/workspace/quick-add-submit'

const VIEW_REQUEST_TIMEOUT_MS = 90_000

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`))
    }, ms)
    promise
      .then((value) => {
        window.clearTimeout(timer)
        resolve(value)
      })
      .catch((err) => {
        window.clearTimeout(timer)
        reject(err)
      })
  })
}

function parseSpaceFromPath(pathname: string): { spaceId: string | null; viewId: string | null } {
  const m = /^\/workspace\/spaces\/([^/]+)(?:\/([^/]+))?/.exec(pathname)
  if (!m) {
    return { spaceId: null, viewId: null }
  }
  const viewId = m[2]
  if (viewId && viewId !== 'entities' && viewId !== 'notes') {
    return { spaceId: m[1]!, viewId }
  }
  return { spaceId: m[1]!, viewId: null }
}

type CommandItem = { id: string; title: string; spaceId: string }

export type UseWorkspaceCommandActionsArgs = {
  items: CommandItem[]
  spaces: Space[]
  entities: Entity[]
  notePages: {
    pageId: string
    ownerType: string
    ownerId: string
    bodyText: string
  }[]
}

export function useWorkspaceCommandActions({
  items,
  spaces,
  entities,
  notePages,
}: UseWorkspaceCommandActionsArgs) {
  const router = useRouter()
  const pathname = usePathname()
  const { openItem, showActivityToast, closeCommandBar, setCommandQuery, commandBarOpen } =
    useWorkspaceUi()
  const [busy, setBusy] = useState(false)
  const viewRequestEpochRef = useRef(0)

  useEffect(() => {
    if (!commandBarOpen) {
      viewRequestEpochRef.current += 1
    }
  }, [commandBarOpen])

  const { spaceId: pathSpaceId } = parseSpaceFromPath(pathname ?? '')
  const defaultSpaceId = useMemo(
    () => pathSpaceId ?? spaces.find((s) => s.isDefault)?.id ?? spaces[0]?.id ?? null,
    [pathSpaceId, spaces]
  )

  const jumpResultsForQuery = useCallback(
    (query: string) => {
      const notes = notePages.map((p) => {
        const space = spaces.find((s) =>
          p.ownerType === 'space' ? s.id === p.ownerId : entities.some((e) => e.id === p.ownerId && e.spaceId === s.id)
        )
        const entity = p.ownerType === 'entity' ? entities.find((e) => e.id === p.ownerId) : null
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
        query,
        items: items.map((i) => ({ id: i.id, title: i.title })),
        spaces: spaces.map((s) => ({ id: s.id, name: s.name })),
        notes,
      })
    },
    [entities, items, notePages, spaces]
  )

  const runCreate = useCallback(
    async (text: string) => {
      if (!defaultSpaceId || busy) {
        return false
      }
      const live = parseQuickAdd(text, new Date())
      const payload = quickAddParseToCreatePayload(live)
      setBusy(true)
      try {
        const createResult = await quickCreateWorkItemAction({
          ...payload,
          spaceResolution: {
            fromSpaceView: pathSpaceId !== null,
            contextSpaceId: pathSpaceId,
          },
        })
        if (!createResult.ok) {
          showActivityToast(createResult.message)
          return false
        }
        if (createResult.reactivatedEntityName) {
          showActivityToast(`${createResult.reactivatedEntityName} is active again`)
        }
        if (createResult.spaceSort?.unsorted) {
          showActivityToast('Added, but needs a space — check Overview')
        }
        setCommandQuery('')
        closeCommandBar()
        router.refresh()
        return true
      } finally {
        setBusy(false)
      }
    },
    [busy, closeCommandBar, defaultSpaceId, pathSpaceId, router, setCommandQuery, showActivityToast]
  )

  const runJump = useCallback(
    (target: CommandBarJumpTarget) => {
      if (target.type === 'item') {
        const match = items.find((i) => i.id === target.id)
        const spaceId = match?.spaceId
        setCommandQuery('')
        closeCommandBar()
        if (spaceId) {
          router.push(`${spaceListHref(spaceId)}?item=${target.id}`)
        } else {
          openItem(target.id)
        }
        return
      }
      if (target.type === 'space') {
        setCommandQuery('')
        closeCommandBar()
        router.push(spaceListHref(target.id))
        return
      }
      const spaceId =
        target.ownerType === 'space'
          ? target.ownerId
          : entities.find((e) => e.id === target.ownerId)?.spaceId
      setCommandQuery('')
      closeCommandBar()
      if (!spaceId) {
        return
      }
      router.push(
        target.ownerType === 'space'
          ? spaceNotesHref(target.ownerId)
          : spaceEntityHref(spaceId, target.ownerId)
      )
    },
    [closeCommandBar, entities, items, openItem, router, setCommandQuery]
  )

  const runViewRequest = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || busy || !defaultSpaceId) {
        return false
      }
      const epoch = viewRequestEpochRef.current
      setBusy(true)
      try {
        const result = await withTimeout(
          runCommandViewRequestAction({ spaceId: defaultSpaceId, text: trimmed }),
          VIEW_REQUEST_TIMEOUT_MS,
          'View request'
        )
        if (epoch !== viewRequestEpochRef.current) {
          return false
        }
        if (!result.ok) {
          showActivityToast(result.message)
          return false
        }
        if (result.action === 'unsupported') {
          showActivityToast(result.message)
          return false
        }
        setCommandQuery('')
        closeCommandBar()
        router.push(spaceViewHref(result.spaceId, result.viewId))
        router.refresh()
        return true
      } catch {
        showActivityToast('Could not run that request. Try again.')
        return false
      } finally {
        if (epoch === viewRequestEpochRef.current) {
          setBusy(false)
        }
      }
    },
    [busy, closeCommandBar, defaultSpaceId, router, setCommandQuery, showActivityToast]
  )

  const submitQuery = useCallback(
    async (query: string, activeRow: Parameters<typeof decideCommandBarSubmit>[2] = null) => {
      const trimmed = query.trim()
      if (!trimmed || busy) {
        return
      }
      const jumps = jumpResultsForQuery(trimmed)
      const decision = decideCommandBarSubmit(trimmed, jumps, activeRow)
      if (decision.action === 'none') {
        return
      }
      if (decision.action === 'create') {
        await runCreate(decision.text)
        return
      }
      if (decision.action === 'jump') {
        runJump(decision.target)
        return
      }
      await runViewRequest(decision.text)
    },
    [busy, jumpResultsForQuery, runCreate, runJump, runViewRequest]
  )

  return {
    busy,
    defaultSpaceId,
    jumpResultsForQuery,
    submitQuery,
    runJump,
    runViewRequest,
  }
}
