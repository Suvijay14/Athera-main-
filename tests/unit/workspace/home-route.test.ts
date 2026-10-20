import { describe, expect, it } from 'vitest'

import { resolveWorkspaceHomeHref, spaceListHref, spaceViewHref } from '@/lib/workspace/home-route'

describe('resolveWorkspaceHomeHref', () => {
  it('redirects to sole space list when one space', () => {
    expect(resolveWorkspaceHomeHref([{ id: 'a' }])).toBe('/workspace/spaces/a')
  })

  it('redirects to overview when two or more spaces', () => {
    expect(resolveWorkspaceHomeHref([{ id: 'a' }, { id: 'b' }])).toBe('/')
  })
})

describe('space href helpers', () => {
  it('builds space and view paths', () => {
    expect(spaceListHref('s1')).toBe('/workspace/spaces/s1')
    expect(spaceViewHref('s1', 'v1')).toBe('/workspace/spaces/s1/v1')
  })
})
