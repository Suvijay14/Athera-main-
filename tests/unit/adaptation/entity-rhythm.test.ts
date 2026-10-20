import { describe, expect, it } from 'vitest'

import { computeEntityRhythm, pickItemRhythmDate } from '@/lib/adaptation/entity-rhythm'
import type { WorkItem } from '@/lib/db/schemas'

const now = new Date('2026-03-15T12:00:00.000Z')

function item(partial: Partial<WorkItem> & { id: string }): WorkItem {
  return {
    id: partial.id,
    workspaceId: 'w',
    spaceId: 's',
    title: partial.title ?? 'T',
    dueDate: partial.dueDate ?? null,
    notes: null,
    data: {},
    startAt: partial.startAt ?? null,
    endAt: null,
    allDay: false,
    source: 'manual',
    spaceConfidence: null,
    archivedAt: partial.archivedAt ?? null,
    completedAt: partial.completedAt ?? null,
    recurrenceId: partial.recurrenceId ?? null,
    recurrenceInstanceDate: partial.recurrenceInstanceDate ?? null,
    externalProvider: partial.externalProvider ?? null,
    externalId: partial.externalId ?? null,
    createdAt: partial.createdAt ?? '2026-01-01T00:00:00.000Z',
    updatedAt: partial.updatedAt ?? '2026-01-01T00:00:00.000Z',
  }
}

describe('pickItemRhythmDate', () => {
  it('prefers start_at over due_date', () => {
    const d = pickItemRhythmDate(
      item({ id: '1', startAt: '2026-02-01T10:00:00.000Z', dueDate: '2026-03-01' })
    )
    expect(d?.toISOString()).toBe('2026-02-01T10:00:00.000Z')
  })
})

describe('computeEntityRhythm', () => {
  it('returns weekly typical gap for regular items', () => {
    const items = [
      item({ id: '1', dueDate: '2026-02-01' }),
      item({ id: '2', dueDate: '2026-02-08' }),
      item({ id: '3', dueDate: '2026-02-15' }),
    ]
    const r = computeEntityRhythm('e', items, now)
    expect(r.typicalGapDays).toBe(7)
    expect(r.datedItemCount).toBe(3)
    expect(r.hasFutureItems).toBe(false)
  })

  it('returns null typical gap with one dated item', () => {
    const r = computeEntityRhythm('e', [item({ id: '1', dueDate: '2026-02-01' })], now)
    expect(r.typicalGapDays).toBeNull()
    expect(r.datedItemCount).toBe(1)
  })

  it('detects future dated items', () => {
    const r = computeEntityRhythm(
      'e',
      [item({ id: '1', dueDate: '2026-03-20' })],
      now
    )
    expect(r.hasFutureItems).toBe(true)
  })

  it('returns zeros for no items', () => {
    const r = computeEntityRhythm('e', [], now)
    expect(r.datedItemCount).toBe(0)
    expect(r.lastActivityAt).toBeNull()
  })
})
