import { describe, expect, it } from 'vitest'

import { canArchiveSpace } from '@/lib/workspace/space-guards'

describe('canArchiveSpace', () => {
  it('blocks default space', () => {
    expect(canArchiveSpace({ isDefault: true })).toEqual({ ok: false, reason: 'default_space' })
  })

  it('allows non-default space', () => {
    expect(canArchiveSpace({ isDefault: false })).toEqual({ ok: true })
  })
})
