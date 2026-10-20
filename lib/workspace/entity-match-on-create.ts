import { normalizeEntityKey } from '@/lib/adaptation/detector-utils'
import type { Entity } from '@/lib/db/schemas'

/**
 * Best-effort sync match when create payload already links an entity field,
 * or when the title contains a known entity name/alias.
 */
export function resolveEntitySpaceOnCreate(
  title: string,
  data: Record<string, unknown>,
  entityFieldKeys: string[],
  entities: Entity[]
): string | null {
  for (const key of entityFieldKeys) {
    const val = data[key]
    if (typeof val === 'string' && /^[0-9a-f-]{36}$/i.test(val)) {
      const ent = entities.find((e) => e.id === val)
      if (ent) {
        return ent.spaceId
      }
    }
  }

  const normTitle = normalizeEntityKey(title)
  if (!normTitle) {
    return null
  }

  for (const entity of entities) {
    const names = [entity.name, ...entity.aliases]
    for (const name of names) {
      const norm = normalizeEntityKey(name)
      if (!norm || norm.length < 3) {
        continue
      }
      if (normTitle.includes(norm)) {
        return entity.spaceId
      }
    }
  }
  return null
}
