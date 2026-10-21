import { describe, expect, it } from 'vitest'

import { parseBrainDump, splitBrainDumpClauses } from '@/lib/workspace/parse-brain-dump'

const now = new Date('2026-10-11T12:00:00.000-07:00')

describe('splitBrainDumpClauses', () => {
  it('splits Aishi example on "and I need to"', () => {
    const parts = splitBrainDumpClauses('I need to do x and I need to go to y at 3pm')
    expect(parts).toEqual(['I need to do x', 'I need to go to y at 3pm'])
  })
})

describe('parseBrainDump', () => {
  it('maps Aishi example to one task and one timed calendar event', () => {
    const segments = parseBrainDump('I need to do x and I need to go to y at 3pm', now)
    expect(segments).toHaveLength(2)

    const task = segments.find((s) => s.kind === 'task')
    const event = segments.find((s) => s.kind === 'calendar_event')
    expect(task?.title).toBe('x')
    expect(event?.title).toBe('go to y')
    expect(event?.startAt).not.toBeNull()
    expect(new Date(event!.startAt!).getHours()).toBe(15)
  })

  it('treats loose thoughts as notes', () => {
    const segments = parseBrainDump('I always forget stuff', now)
    expect(segments).toHaveLength(1)
    expect(segments[0]?.kind).toBe('note')
    expect(segments[0]?.title).toContain('forget')
  })

  it('returns empty for whitespace-only input', () => {
    expect(parseBrainDump('   \n  ', now)).toEqual([])
  })
})
