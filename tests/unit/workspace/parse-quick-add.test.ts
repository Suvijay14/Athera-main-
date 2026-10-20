import { describe, expect, it } from 'vitest'

import { parseQuickAdd } from '@/lib/workspace/parse-quick-add'

const now = new Date('2026-10-11T12:00:00.000-07:00')

describe('parseQuickAdd', () => {
  it('parses "Maya algebra tue 4pm"', () => {
    const r = parseQuickAdd('Maya algebra tue 4pm', now)
    expect(r.title).toBe('Maya algebra')
    expect(r.matchedText).toBe('tue 4pm')
    expect(r.allDay).toBe(false)
    expect(r.startAt).toBeInstanceOf(Date)
    expect(r.endAt).toBeInstanceOf(Date)
    expect(r.endAt!.getTime() - r.startAt!.getTime()).toBe(60 * 60 * 1000)
  })

  it('parses "dentist friday 10am"', () => {
    const r = parseQuickAdd('dentist friday 10am', now)
    expect(r.title).toBe('dentist')
    expect(r.matchedText).toBe('friday 10am')
    expect(r.allDay).toBe(false)
    expect(r.startAt).not.toBeNull()
  })

  it('leaves title unchanged when no date', () => {
    const r = parseQuickAdd('pick up dry cleaning', now)
    expect(r.title).toBe('pick up dry cleaning')
    expect(r.matchedText).toBeNull()
    expect(r.startAt).toBeNull()
    expect(r.endAt).toBeNull()
    expect(r.allDay).toBe(false)
    expect(r.dueDate).toBeNull()
  })

  it('parses date-only as all-day with dueDate', () => {
    const r = parseQuickAdd('call mom sunday', now)
    expect(r.title).toBe('call mom')
    expect(r.matchedText).toBe('sunday')
    expect(r.allDay).toBe(true)
    expect(r.startAt).toBeNull()
    expect(r.endAt).toBeNull()
    expect(r.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('uses chrono end when an explicit range is parsed', () => {
    const r = parseQuickAdd('meeting 3-4pm tomorrow', now)
    expect(r.title).toBe('meeting')
    expect(r.allDay).toBe(false)
    expect(r.startAt).not.toBeNull()
    expect(r.endAt).not.toBeNull()
    expect(r.endAt!.getTime()).toBeGreaterThan(r.startAt!.getTime())
    // chrono treats "3-4pm" as a one-hour window; we use its end, not a blind +60 default.
    expect(r.endAt!.getTime() - r.startAt!.getTime()).toBe(60 * 60 * 1000)
  })

  it('does not throw on garbage input', () => {
    const r = parseQuickAdd('!!! ??? @@@', now)
    expect(r.title).toBe('!!! ??? @@@')
    expect(r.startAt).toBeNull()
  })
})
