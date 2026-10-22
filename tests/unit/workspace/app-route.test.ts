import { describe, expect, it } from 'vitest'

import { usesWorkspaceChrome } from '@/lib/workspace/app-route'

describe('usesWorkspaceChrome', () => {
  it('is true for workspace routes', () => {
    expect(usesWorkspaceChrome('/')).toBe(false)
    expect(usesWorkspaceChrome('/workspace/overview')).toBe(true)
    expect(usesWorkspaceChrome('/workspace/spaces/x')).toBe(true)
  })

  it('is false for legacy v2 tool routes', () => {
    expect(usesWorkspaceChrome('/setup')).toBe(false)
    expect(usesWorkspaceChrome('/commands')).toBe(false)
    expect(usesWorkspaceChrome(null)).toBe(false)
  })
})
