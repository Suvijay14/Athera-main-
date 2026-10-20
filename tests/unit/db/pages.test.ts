import { describe, expect, it } from 'vitest'

import {
  emptyPageForOwner,
  getPageByOwner,
  getPageForOwnerOrEmpty,
} from '@/lib/db/pages'

const ws = '00000000-0000-4000-8000-000000000001'
const owner = '00000000-0000-4000-8000-000000000010'

function mockClient(result: { data: unknown; error: unknown }) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => result,
            }),
          }),
        }),
      }),
    }),
  }
}

describe('getPageByOwner', () => {
  it('returns null on PGRST116 (no row) instead of throwing', async () => {
    const client = mockClient({
      data: null,
      error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' },
    })
    const page = await getPageByOwner(
      client as unknown as Parameters<typeof getPageByOwner>[0],
      ws,
      'space',
      owner
    )
    expect(page).toBeNull()
  })
})

describe('getPageForOwnerOrEmpty', () => {
  it('returns empty page stub when no row exists', async () => {
    const client = mockClient({ data: null, error: null })
    const page = await getPageForOwnerOrEmpty(
      client as unknown as Parameters<typeof getPageForOwnerOrEmpty>[0],
      ws,
      'space',
      owner
    )
    expect(page.id).toBe('')
    expect(page.body.type).toBe('doc')
    expect(page).toEqual(emptyPageForOwner(ws, 'space', owner))
  })
})
