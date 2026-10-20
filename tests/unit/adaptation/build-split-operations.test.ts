import { describe, expect, it } from 'vitest'

import { buildSplitSpaceOperations } from '@/lib/adaptation/split-space/build-split-operations'

describe('buildSplitSpaceOperations', () => {
  it('creates spaces before moves in order', () => {
    const spaceA = '00000000-0000-4000-8000-000000000010'
    const spaceB = '00000000-0000-4000-8000-000000000020'
    const item1 = '00000000-0000-4000-8000-000000000030'
    const item2 = '00000000-0000-4000-8000-000000000040'

    const ops = buildSplitSpaceOperations({
      sourceSpaceId: 'source',
      clusters: [
        { clusterIndex: 0, name: 'Tutoring', spaceId: spaceA, itemIds: [item1], entityIds: [] },
        { clusterIndex: 1, name: 'Errands', spaceId: spaceB, itemIds: [item2], entityIds: [] },
      ],
    })

    expect(ops[0]).toMatchObject({ op: 'create_space', space: { name: 'Tutoring' } })
    expect(ops[1]).toMatchObject({ op: 'create_space', space: { name: 'Errands' } })
    expect(ops.filter((o) => o.op === 'move_work_item_space')).toHaveLength(2)
    const moveOps = ops.filter((o) => o.op === 'move_work_item_space')
    expect(moveOps[0]).toMatchObject({ itemId: item1, spaceId: spaceA })
    expect(moveOps[1]).toMatchObject({ itemId: item2, spaceId: spaceB })
  })
})
