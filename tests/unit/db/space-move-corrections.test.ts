import { describe, expect, it, vi } from 'vitest'

import { listRecentSpaceMoveCorrections } from '@/lib/db/space-move-corrections'

describe('listRecentSpaceMoveCorrections', () => {
  it('returns empty list when table is not migrated yet', async () => {
    const client = {
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: async () => ({
                data: null,
                error: {
                  code: 'PGRST205',
                  message: "Could not find the table 'public.space_move_corrections' in the schema cache",
                },
              }),
            }),
          }),
        }),
      }),
    }
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = await listRecentSpaceMoveCorrections(
      client as unknown as Parameters<typeof listRecentSpaceMoveCorrections>[0],
      '00000000-0000-4000-8000-000000000001'
    )
    expect(result).toEqual([])
    warn.mockRestore()
  })
})
