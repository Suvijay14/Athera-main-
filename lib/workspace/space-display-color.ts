import type { Entity, Space } from '@/lib/db/schemas'

const FALLBACK_SPACE_COLOR = '#6366f1'

/**
 * Single source of truth for a space's display color (sidebar avatars, calendar blocks, legend pills).
 */
export function spaceDisplayColor(space: Pick<Space, 'color'> | null | undefined): string {
  const c = space?.color?.trim()
  return c && c.length > 0 ? c : FALLBACK_SPACE_COLOR
}

/**
 * Entity color stays aligned with the space it lives in (child client spaces share one color everywhere).
 */
export function entityDisplayColor(
  entity: Pick<Entity, 'color'> | null | undefined,
  space: Pick<Space, 'color'> | null | undefined
): string {
  if (space?.color?.trim()) {
    return spaceDisplayColor(space)
  }
  const c = entity?.color?.trim()
  return c && c.length > 0 ? c : FALLBACK_SPACE_COLOR
}
