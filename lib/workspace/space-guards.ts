import type { Space } from '@/lib/db/schemas'

export type SpaceArchiveGuardResult =
  | { ok: true }
  | { ok: false; reason: 'default_space' | 'not_found' }

export function canArchiveSpace(space: Pick<Space, 'isDefault'> | null | undefined): SpaceArchiveGuardResult {
  if (!space) {
    return { ok: false, reason: 'not_found' }
  }
  if (space.isDefault) {
    return { ok: false, reason: 'default_space' }
  }
  return { ok: true }
}
