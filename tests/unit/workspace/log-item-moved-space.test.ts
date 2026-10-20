import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/lib/events', () => ({
  track: vi.fn(),
}))

vi.mock('@/lib/db/space-move-corrections', () => ({
  recordSpaceMoveCorrection: vi.fn(),
}))

import { track } from '@/lib/events'
import { recordSpaceMoveCorrection } from '@/lib/db/space-move-corrections'
import { logItemMovedSpace } from '@/lib/workspace/log-item-moved-space'

describe('logItemMovedSpace', () => {
  beforeEach(() => {
    vi.mocked(track).mockReset()
    vi.mocked(recordSpaceMoveCorrection).mockReset()
  })

  it('never puts title in event props', async () => {
    const client = {} as Parameters<typeof logItemMovedSpace>[0]
    await logItemMovedSpace(client, {
      workspaceId: 'w',
      userId: 'u',
      itemId: 'i',
      fromSpaceId: 'a',
      toSpaceId: 'b',
      title: 'Secret client name',
    })

    expect(track).toHaveBeenCalledWith(client, {
      workspaceId: 'w',
      userId: 'u',
      name: 'item_moved_space',
      props: {
        item_id: 'i',
        from_space_id: 'a',
        to_space_id: 'b',
      },
    })
    expect(JSON.stringify(vi.mocked(track).mock.calls[0])).not.toContain('Secret')
    expect(recordSpaceMoveCorrection).toHaveBeenCalledWith(
      client,
      expect.objectContaining({ title: 'Secret client name' })
    )
  })
})
