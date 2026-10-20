import { describe, expect, it } from 'vitest'

import {
  rankCommandBarJumpTargets,
  shouldPreferCreateOverJump,
} from '@/lib/workspace/command-bar-search'

describe('rankCommandBarJumpTargets', () => {
  const items = [
    { id: '1', title: 'Rivera Plumbing quote' },
    { id: '2', title: 'General admin' },
  ]
  const spaces = [{ id: 's1', name: 'My space' }]

  it('ranks prefix matches higher', () => {
    const results = rankCommandBarJumpTargets({
      query: 'rivera',
      items,
      spaces,
    })
    expect(results[0]?.type).toBe('item')
    expect(results[0]?.type === 'item' && results[0].title).toContain('Rivera')
  })

  it('returns empty jump list for unrelated query', () => {
    const results = rankCommandBarJumpTargets({
      query: 'zzzznotfound',
      items,
      spaces,
    })
    expect(results).toEqual([])
  })
})

describe('shouldPreferCreateOverJump', () => {
  it('prefers create when no jump hits', () => {
    expect(shouldPreferCreateOverJump('new thing', [])).toBe(true)
  })
})
