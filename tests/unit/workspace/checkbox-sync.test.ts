import { describe, expect, it } from 'vitest'

import { planCheckboxSyncActions } from '@/lib/workspace/notes/checkbox-sync'

const NOW = '2026-10-14T12:00:00.000Z'

describe('planCheckboxSyncActions', () => {
  it('creates item for new checkbox without itemId', () => {
    const actions = planCheckboxSyncActions(
      [],
      [{ checkboxId: 'a', text: 'call supplier friday', checked: false, itemId: null }],
      NOW
    )
    expect(actions).toEqual([
      { kind: 'create', checkboxId: 'a', text: 'call supplier friday' },
    ])
  })

  it('creates undated item when text has no date', () => {
    const actions = planCheckboxSyncActions(
      [],
      [{ checkboxId: 'b', text: 'send revised mockups', checked: false, itemId: null }],
      NOW
    )
    expect(actions).toHaveLength(1)
    expect(actions[0]).toMatchObject({ kind: 'create', text: 'send revised mockups' })
  })

  it('does not recreate when itemId already linked (save loop guard)', () => {
    const prev = [
      { checkboxId: 'a', text: 'task', checked: false, itemId: '00000000-0000-4000-8000-000000000010' },
    ]
    const curr = [
      { checkboxId: 'a', text: 'task', checked: false, itemId: '00000000-0000-4000-8000-000000000010' },
    ]
    expect(planCheckboxSyncActions(prev, curr, NOW)).toEqual([])
  })

  it('updates completion when checked state changes', () => {
    const itemId = '00000000-0000-4000-8000-000000000010'
    const prev = [{ checkboxId: 'a', text: 'x', checked: false, itemId }]
    const curr = [{ checkboxId: 'a', text: 'x', checked: true, itemId }]
    expect(planCheckboxSyncActions(prev, curr, NOW)).toEqual([
      { kind: 'completion', itemId, completedAt: NOW },
    ])
  })

  it('clears completion when unchecked', () => {
    const itemId = '00000000-0000-4000-8000-000000000010'
    const prev = [{ checkboxId: 'a', text: 'x', checked: true, itemId }]
    const curr = [{ checkboxId: 'a', text: 'x', checked: false, itemId }]
    expect(planCheckboxSyncActions(prev, curr, NOW)).toEqual([
      { kind: 'completion', itemId, completedAt: null },
    ])
  })
})
