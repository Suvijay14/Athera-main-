import type { Space } from '@/lib/db/schemas'
import { WORKSPACE_OVERVIEW_PATH } from '@/lib/routes/product-entry'

/**
 * Where /workspace should redirect (server-side, no client flash).
 * One space → that space's list. Two or more → Overview.
 */
export function resolveWorkspaceHomeHref(spaces: Pick<Space, 'id'>[]): string {
  const active = spaces
  if (active.length <= 1) {
    const only = active[0]
    if (!only) {
      return WORKSPACE_OVERVIEW_PATH
    }
    return `/workspace/spaces/${only.id}`
  }
  return WORKSPACE_OVERVIEW_PATH
}

export function spaceListHref(spaceId: string): string {
  return `/workspace/spaces/${spaceId}`
}

export function spaceViewHref(spaceId: string, viewId: string): string {
  return `/workspace/spaces/${spaceId}/${viewId}`
}

export function spaceNotesHref(spaceId: string): string {
  return `/workspace/spaces/${spaceId}/notes`
}

export function spaceCalendarHref(spaceId: string): string {
  return `/workspace/spaces/${spaceId}/calendar`
}

export function spaceEntityHref(spaceId: string, entityId: string): string {
  return `/workspace/spaces/${spaceId}/entities/${entityId}`
}
