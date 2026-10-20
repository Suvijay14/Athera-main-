import { describe, expect, it } from 'vitest'

import { checkPlanLimit } from '@/lib/billing/limits'
import { FREE_MAX_OPEN_ITEMS, FREE_MAX_SPACES } from '@/lib/billing/plans'

describe('checkPlanLimit', () => {
  const freeBase = {
    plan: 'free' as const,
    subscriptionStatus: 'active' as const,
    nonArchivedSpaceCount: 0,
    openItemCount: 0,
  }

  it('allows paid personal unlimited creates', () => {
    expect(
      checkPlanLimit(
        {
          plan: 'personal',
          subscriptionStatus: 'active',
          nonArchivedSpaceCount: 50,
          openItemCount: 500,
        },
        'create_item'
      ).allowed
    ).toBe(true)
  })

  it('blocks free space over limit', () => {
    const r = checkPlanLimit(
      { ...freeBase, nonArchivedSpaceCount: FREE_MAX_SPACES },
      'create_space'
    )
    expect(r.allowed).toBe(false)
    if (!r.allowed) {
      expect(r.limit).toBe('spaces')
    }
  })

  it('allows free space at under limit', () => {
    expect(
      checkPlanLimit(
        { ...freeBase, nonArchivedSpaceCount: FREE_MAX_SPACES - 1 },
        'create_space'
      ).allowed
    ).toBe(true)
  })

  it('blocks free open items at limit', () => {
    const r = checkPlanLimit(
      { ...freeBase, openItemCount: FREE_MAX_OPEN_ITEMS },
      'create_item'
    )
    expect(r.allowed).toBe(false)
    if (!r.allowed) {
      expect(r.limit).toBe('open_items')
    }
  })

  it('allows free open items below limit', () => {
    expect(
      checkPlanLimit(
        { ...freeBase, openItemCount: FREE_MAX_OPEN_ITEMS - 1 },
        'create_item'
      ).allowed
    ).toBe(true)
  })
})
