import { describe, expect, it } from 'vitest'

import { buildSplitSpaceOperations } from '@/lib/adaptation/split-space/build-split-operations'
import {
  parseSplitSuggestionOperations,
  rebuildSplitSpaceOperations,
} from '@/lib/adaptation/split-space/rebuild-split-operations'

const spaceA = '00000000-0000-4000-8000-000000000010'
const spaceB = '00000000-0000-4000-8000-000000000020'
const item1 = '00000000-0000-4000-8000-000000000030'
const item2 = '00000000-0000-4000-8000-000000000040'

describe('rebuildSplitSpaceOperations', () => {
  it('parses original split ops and rebuilds with corrected item assignment', () => {
    const original = buildSplitSpaceOperations({
      sourceSpaceId: 'source',
      clusters: [
        { clusterIndex: 0, name: 'A', spaceId: spaceA, itemIds: [item1, item2], entityIds: [] },
        { clusterIndex: 1, name: 'B', spaceId: spaceB, itemIds: [], entityIds: [] },
      ],
    })

    const { itemIds, clusters } = parseSplitSuggestionOperations(original)
    expect(itemIds).toEqual([item1, item2])

    const corrected = new Map<string, string>([
      [item1, spaceA],
      [item2, spaceB],
    ])

    const rebuilt = rebuildSplitSpaceOperations({
      clusters,
      sourceSpaceId: 'source',
      itemAssignments: corrected,
      entities: [],
      fields: [],
      items: [
        {
          id: item1,
          workspaceId: 'w',
          spaceId: 'source',
          title: 'T1',
          dueDate: null,
          notes: null,
          data: {},
          startAt: null,
          endAt: null,
          allDay: false,
          source: 'manual',
          spaceConfidence: null,
          archivedAt: null,
          completedAt: null,
          recurrenceId: null,
          recurrenceInstanceDate: null,
          externalProvider: null,
          externalId: null,
          createdAt: '',
          updatedAt: '',
        },
        {
          id: item2,
          workspaceId: 'w',
          spaceId: 'source',
          title: 'T2',
          dueDate: null,
          notes: null,
          data: {},
          startAt: null,
          endAt: null,
          allDay: false,
          source: 'manual',
          spaceConfidence: null,
          archivedAt: null,
          completedAt: null,
          recurrenceId: null,
          recurrenceInstanceDate: null,
          externalProvider: null,
          externalId: null,
          createdAt: '',
          updatedAt: '',
        },
      ],
    })

    const moves = rebuilt.filter((o) => o.op === 'move_work_item_space')
    expect(moves).toContainEqual({ op: 'move_work_item_space', itemId: item1, spaceId: spaceA })
    expect(moves).toContainEqual({ op: 'move_work_item_space', itemId: item2, spaceId: spaceB })
  })
})
