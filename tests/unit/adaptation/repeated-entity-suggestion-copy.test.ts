import { describe, expect, it } from 'vitest'

import {
  entityCountPillsFromOperations,
  groupByCtaFromOperations,
  repeatedEntityHeadline,
  repeatedEntityReasoningLine,
} from '@/lib/adaptation/repeated-entity-suggestion-copy'
import type { Operation } from '@/lib/adaptation/types'

describe('repeated-entity-suggestion-copy', () => {
  const ops: Operation[] = [
    {
      op: 'create_field',
      field: { key: 'client', label: 'Client', type: 'entity', entityKind: 'client' },
    },
    {
      op: 'backfill_field',
      key: 'client',
      values: {
        a: 'Rivera Bakery',
        b: 'Rivera Bakery',
        c: 'Rivera Bakery',
        d: 'Rivera Bakery',
        e: 'Lumen Health',
        f: 'Lumen Health',
        g: 'Oak & Iron',
      },
    },
  ]

  it('builds entity count pills from backfill operations', () => {
    expect(entityCountPillsFromOperations(ops)).toEqual([
      { name: 'Rivera Bakery', count: 4 },
      { name: 'Lumen Health', count: 2 },
      { name: 'Oak & Iron', count: 1 },
    ])
  })

  it('formats mockup headline and reasoning', () => {
    expect(
      repeatedEntityHeadline({ entity: 'Rivera Bakery', count: 4 }, 'client')
    ).toBe('Rivera Bakery shows up in 4 things this week. Group your work by client?')
    expect(
      repeatedEntityReasoningLine(entityCountPillsFromOperations(ops), 'Rivera Bakery')
    ).toBe('Based on 4 items naming Rivera Bakery, plus Lumen Health and Oak & Iron.')
  })

  it('derives group-by CTA label', () => {
    expect(groupByCtaFromOperations(ops)).toBe('Group by client')
  })
})
