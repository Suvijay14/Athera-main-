import { describe, expect, it } from 'vitest'

import { detectSplitSpaceForSpace } from '@/lib/adaptation/detectors/detect-split-space'
import { clusterItemTitles } from '@/lib/adaptation/split-space/title-clustering'

const spaceId = '00000000-0000-4000-8000-000000000010'

function tutoringTitle(i: number): string {
  return `Maya algebra session ${i}`
}

function errandTitle(i: number): string {
  return `grocery store run ${i}`
}

describe('clusterItemTitles', () => {
  it('stays silent under 20 items', () => {
    const items = Array.from({ length: 15 }, (_, i) => ({
      id: String(i),
      title: tutoringTitle(i),
    }))
    expect(clusterItemTitles(items)).toBeNull()
  })

  it('finds two clusters on separated vocabulary', () => {
    const items = [
      ...Array.from({ length: 12 }, (_, i) => ({ id: `t${i}`, title: tutoringTitle(i) })),
      ...Array.from({ length: 12 }, (_, i) => ({ id: `e${i}`, title: errandTitle(i) })),
    ]
    const cluster = clusterItemTitles(items)
    expect(cluster).not.toBeNull()
    expect(cluster!.k).toBe(2)
    expect(cluster!.silhouette).toBeGreaterThanOrEqual(0.35)
  })
})

describe('detectSplitSpaceForSpace', () => {
  it('fires on a clear two-cluster space', () => {
    const open = [
      ...Array.from({ length: 12 }, (_, i) => ({
        id: `00000000-0000-4000-8000-0000000000${String(i).padStart(2, '0')}`,
        workspaceId: 'w',
        spaceId,
        title: tutoringTitle(i),
        dueDate: null,
        notes: null,
        data: {},
        startAt: null,
        endAt: null,
        allDay: false,
        source: 'manual' as const,
        spaceConfidence: null,
        archivedAt: null,
        completedAt: null,
        recurrenceId: null,
        recurrenceInstanceDate: null,
        externalProvider: null,
        externalId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
      ...Array.from({ length: 12 }, (_, i) => ({
        id: `00000000-0000-4000-8000-0000000001${String(i).padStart(2, '0')}`,
        workspaceId: 'w',
        spaceId,
        title: errandTitle(i),
        dueDate: null,
        notes: null,
        data: {},
        startAt: null,
        endAt: null,
        allDay: false,
        source: 'manual' as const,
        spaceConfidence: null,
        archivedAt: null,
        completedAt: null,
        recurrenceId: null,
        recurrenceInstanceDate: null,
        externalProvider: null,
        externalId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
    ]

    const draft = detectSplitSpaceForSpace({
      spaceId,
      items: open,
      fields: [],
      entities: [],
      clusterNames: ['Tutoring', 'Errands'],
      now: new Date(),
    })

    expect(draft).not.toBeNull()
    expect(draft!.type).toBe('split_space')
    expect(draft!.operations.some((o) => o.op === 'create_space')).toBe(true)
  })
})
