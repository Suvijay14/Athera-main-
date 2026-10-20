import { addMonths, parseISO } from 'date-fns'
import { describe, expect, it } from 'vitest'

import type { RecurrenceRule } from '@/lib/db/schemas'
import { generateInstances } from '@/lib/workspace/recurrence'

function baseRule(overrides: Partial<RecurrenceRule> = {}): RecurrenceRule {
  return {
    id: '00000000-0000-4000-8000-000000000099',
    workspaceId: '00000000-0000-4000-8000-000000000001',
    spaceId: '00000000-0000-4000-8000-000000000010',
    templateItem: { title: 'Weekly standup' },
    freq: 'weekly',
    intervalCount: 1,
    byWeekday: [2],
    timeOfDay: '17:00',
    durationMin: 60,
    startsOn: '2026-01-06',
    endsOn: null,
    exceptions: [],
    active: true,
    source: 'athera',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('generateInstances', () => {
  it('generates weekly instances across four weeks', () => {
    const rule = baseRule()
    const start = parseISO('2026-01-01T00:00:00.000Z')
    const end = parseISO('2026-02-01T00:00:00.000Z')
    const instances = generateInstances(rule, start, end)
    expect(instances.length).toBeGreaterThanOrEqual(3)
    expect(instances.every((i) => i.instanceDate >= rule.startsOn)).toBe(true)
  })

  it('biweekly interval skips alternate weeks', () => {
    const rule = baseRule({ intervalCount: 2, startsOn: '2026-01-06' })
    const instances = generateInstances(
      rule,
      parseISO('2026-01-01T00:00:00.000Z'),
      parseISO('2026-02-15T00:00:00.000Z')
    )
    const dates = instances.map((i) => i.instanceDate)
    expect(dates).toContain('2026-01-06')
    expect(dates).toContain('2026-01-20')
    expect(dates).not.toContain('2026-01-13')
  })

  it('skips exception dates', () => {
    const rule = baseRule({ exceptions: ['2026-01-13'] })
    const instances = generateInstances(
      rule,
      parseISO('2026-01-01T00:00:00.000Z'),
      parseISO('2026-01-31T00:00:00.000Z')
    )
    expect(instances.map((i) => i.instanceDate)).not.toContain('2026-01-13')
  })

  it('respects endsOn', () => {
    const rule = baseRule({ endsOn: '2026-01-20' })
    const instances = generateInstances(
      rule,
      parseISO('2026-01-01T00:00:00.000Z'),
      addMonths(parseISO('2026-01-01T00:00:00.000Z'), 2)
    )
    expect(instances.every((i) => i.instanceDate <= '2026-01-20')).toBe(true)
  })

  it('produces stable virtual ids', () => {
    const rule = baseRule()
    const inst = generateInstances(
      rule,
      parseISO('2026-01-06T00:00:00.000Z'),
      parseISO('2026-01-07T00:00:00.000Z')
    )
    expect(inst[0]?.virtualId).toBe(`recurrence:${rule.id}:2026-01-06`)
  })
})
