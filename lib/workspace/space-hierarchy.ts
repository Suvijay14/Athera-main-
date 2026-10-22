import type { Space } from '@/lib/db/schemas'

export function buildChildSpacesByParentId(spaces: Space[]): Map<string, Space[]> {
  const byParent = new Map<string, Space[]>()
  for (const space of spaces) {
    if (!space.parentSpaceId || space.archivedAt) {
      continue
    }
    const list = byParent.get(space.parentSpaceId) ?? []
    list.push(space)
    byParent.set(space.parentSpaceId, list)
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
  }
  return byParent
}

export function topLevelSpaces(spaces: Space[]): Space[] {
  return spaces
    .filter((s) => !s.parentSpaceId && !s.archivedAt)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
}

export function descendantSpaceIds(parentId: string, childByParent: Map<string, Space[]>): string[] {
  const direct = childByParent.get(parentId) ?? []
  const ids: string[] = []
  for (const child of direct) {
    ids.push(child.id)
    ids.push(...descendantSpaceIds(child.id, childByParent))
  }
  return ids
}

export function spaceTreeIds(rootSpaceId: string, childByParent: Map<string, Space[]>): string[] {
  return [rootSpaceId, ...descendantSpaceIds(rootSpaceId, childByParent)]
}

/** Direct counts plus rolled-up totals for every ancestor. */
export function rollupItemCountsBySpace(
  directCounts: Record<string, number>,
  spaces: Space[]
): Record<string, number> {
  const childByParent = buildChildSpacesByParentId(spaces)
  const rolled: Record<string, number> = { ...directCounts }

  function subtreeTotal(spaceId: string): number {
    let sum = directCounts[spaceId] ?? 0
    for (const child of childByParent.get(spaceId) ?? []) {
      sum += subtreeTotal(child.id)
    }
    rolled[spaceId] = sum
    return sum
  }

  for (const space of spaces) {
    if (!space.archivedAt) {
      subtreeTotal(space.id)
    }
  }
  return rolled
}

export function rootSpaceIdForItem(
  itemSpaceId: string,
  spacesById: Map<string, Space>
): string {
  let current = spacesById.get(itemSpaceId)
  if (!current) {
    return itemSpaceId
  }
  while (current.parentSpaceId) {
    const parent = spacesById.get(current.parentSpaceId)
    if (!parent) {
      break
    }
    current = parent
  }
  return current.id
}

export function spaceNavInitial(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) {
    return '?'
  }
  return trimmed.charAt(0).toUpperCase()
}
