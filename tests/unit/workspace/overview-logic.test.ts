import { describe, expect, it } from 'vitest'

import type { Space, WorkItem } from '@/lib/db/schemas'
import {
  buildSpaceOverviewCards,
  countOverviewNeedYou,
  isOpenWorkItem,
} from '@/lib/workspace/overview-logic'
import { makeItem } from '../detectors/fixtures'

const spaceA: Space = {
  id: '00000000-0000-4000-8000-000000000010',
  workspaceId: '00000000-0000-4000-8000-000000000099',
  name: 'Clients',
  icon: null,
  color: null,
  sortOrder: 0,
  isDefault: true,
  archivedAt: null,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
}

const spaceB: Space = {
  ...spaceA,
  id: '00000000-0000-4000-8000-000000000011',
  name: 'Personal',
  isDefault: false,
}

const now = new Date('2026-03-10T12:00:00.000Z')

describe('buildSpaceOverviewCards', () => {
  it('counts open items per space and ignores other spaces', () => {
    const items: WorkItem[] = [
      makeItem({ id: '1', spaceId: spaceA.id, title: 'A1' }),
      makeItem({ id: '2', spaceId: spaceA.id, title: 'A2', completedAt: '2026-03-01T00:00:00.000Z' }),
      makeItem({ id: '3', spaceId: spaceB.id, title: 'B1' }),
    ]
    const cards = buildSpaceOverviewCards([spaceA, spaceB], items, now)
    const a = cards.find((c) => c.space.id === spaceA.id)
    const b = cards.find((c) => c.space.id === spaceB.id)
    expect(a?.openCount).toBe(1)
    expect(b?.openCount).toBe(1)
  })

  it('formats next upcoming item with time in space', () => {
    const items: WorkItem[] = [
      makeItem({
        id: '1',
        spaceId: spaceA.id,
        title: 'Site review',
        startAt: '2026-03-10T14:00:00.000Z',
      }),
      makeItem({
        id: '2',
        spaceId: spaceA.id,
        title: 'Later',
        startAt: '2026-03-12T14:00:00.000Z',
      }),
    ]
    const card = buildSpaceOverviewCards([spaceA], items, now)[0]
    expect(card?.nextLabel).toContain('Site review')
    expect(card?.nextLabel).toMatch(/Next:/)
  })
})

describe('isOpenWorkItem', () => {
  it('excludes completed and archived', () => {
    expect(isOpenWorkItem(makeItem({ title: 'x', completedAt: '2026-01-01T00:00:00.000Z' }))).toBe(false)
    expect(isOpenWorkItem(makeItem({ title: 'x', archivedAt: '2026-01-01T00:00:00.000Z' }))).toBe(false)
    expect(isOpenWorkItem(makeItem({ title: 'x' }))).toBe(true)
  })
})

describe('countOverviewNeedYou', () => {
  it('includes pending suggestion in count', () => {
    const items = [
      makeItem({
        title: 'Due today',
        dueDate: '2026-03-10',
      }),
    ]
    expect(countOverviewNeedYou(items, now, false)).toBe(1)
    expect(countOverviewNeedYou(items, now, true)).toBe(2)
  })
})
