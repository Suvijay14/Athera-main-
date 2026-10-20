import { describe, expect, it } from 'vitest'

import {
  createEntityInputSchema,
  createFieldInputSchema,
  createSpaceInputSchema,
  createViewInputSchema,
} from '@/lib/db/schemas'

describe('spaces and entities schemas', () => {
  it('createSpaceInputSchema trims name', () => {
    const parsed = createSpaceInputSchema.parse({ name: '  Shop  ' })
    expect(parsed.name).toBe('Shop')
  })

  it('createEntityInputSchema requires space and kind', () => {
    const parsed = createEntityInputSchema.parse({
      spaceId: '00000000-0000-4000-8000-000000000001',
      kind: 'client',
      name: 'Acme',
    })
    expect(parsed.aliases).toEqual([])
  })

  it('createFieldInputSchema requires entityKind for entity type', () => {
    expect(() =>
      createFieldInputSchema.parse({
        key: 'client_ref',
        label: 'Client',
        type: 'entity',
        source: 'user',
      })
    ).toThrow()
    const ok = createFieldInputSchema.parse({
      key: 'client_ref',
      label: 'Client',
      type: 'entity',
      entityKind: 'client',
      source: 'user',
    })
    expect(ok.entityKind).toBe('client')
  })

  it('createViewInputSchema allows calendar without groupByField', () => {
    const parsed = createViewInputSchema.parse({
      name: 'Schedule',
      type: 'calendar',
      source: 'user',
    })
    expect(parsed.type).toBe('calendar')
  })
})
