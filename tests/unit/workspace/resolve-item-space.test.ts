import { describe, expect, it } from 'vitest'

import {
  applyClassificationThreshold,
  resolveItemSpaceHardRule,
} from '@/lib/workspace/resolve-item-space'

const defaultSpaceId = '00000000-0000-4000-8000-000000000001'
const spaceA = '00000000-0000-4000-8000-000000000010'
const spaceB = '00000000-0000-4000-8000-000000000020'
const entityId = '00000000-0000-4000-8000-000000000030'

describe('resolveItemSpaceHardRule', () => {
  it('uses space view context first', () => {
    const result = resolveItemSpaceHardRule({
      title: 'anything',
      data: {},
      ctx: { fromSpaceView: true, contextSpaceId: spaceA },
      entities: [],
      entityKeys: [],
      defaultSpaceId,
    })
    expect(result).toEqual({ spaceId: spaceA, confidence: null, method: 'hard-rule' })
  })

  it('uses recurrence space when source is recurrence', () => {
    const result = resolveItemSpaceHardRule({
      title: 'weekly',
      data: {},
      ctx: { fromSpaceView: false, contextSpaceId: null, source: 'recurrence', recurrenceSpaceId: spaceB },
      entities: [],
      entityKeys: [],
      defaultSpaceId,
    })
    expect(result?.spaceId).toBe(spaceB)
  })

  it('uses entity space when entity field is set', () => {
    const result = resolveItemSpaceHardRule({
      title: 'call',
      data: { client: entityId },
      ctx: { fromSpaceView: false, contextSpaceId: null },
      entities: [
        {
          id: entityId,
          workspaceId: 'w',
          spaceId: spaceB,
          kind: 'client',
          name: 'Rivera',
          aliases: [],
          color: null,
          lastActivityAt: null,
          typicalGapDays: null,
          archivedAt: null,
          excludedFromSuggestions: false,
          createdAt: '',
          updatedAt: '',
        },
      ],
      entityKeys: ['client'],
      defaultSpaceId,
    })
    expect(result?.spaceId).toBe(spaceB)
  })

  it('returns null when classification should run', () => {
    const result = resolveItemSpaceHardRule({
      title: 'misc errand',
      data: {},
      ctx: { fromSpaceView: false, contextSpaceId: null },
      entities: [],
      entityKeys: [],
      defaultSpaceId,
    })
    expect(result).toBeNull()
  })
})

describe('applyClassificationThreshold', () => {
  it('assigns high confidence directly', () => {
    expect(
      applyClassificationThreshold({ space_id: spaceA, confidence: 0.9 }, defaultSpaceId)
    ).toEqual({ spaceId: spaceA, confidence: 0.9, method: 'classified' })
  })

  it('keeps default space as unsorted when low confidence', () => {
    expect(
      applyClassificationThreshold({ space_id: spaceA, confidence: 0.5 }, defaultSpaceId)
    ).toEqual({ spaceId: defaultSpaceId, confidence: 0.5, method: 'unsorted' })
  })
})
