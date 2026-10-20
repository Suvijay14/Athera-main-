import { describe, expect, it } from 'vitest'

import { detectStatusInNotes } from '@/lib/adaptation/detectors/detect-status-in-notes'

import { baseContext, makeField, makeItem, makeSuggestion } from './fixtures'

describe('detectStatusInNotes', () => {
  it('fires when status words appear in enough notes', () => {
    const items = [
      makeItem({ title: 'A', notes: 'marked paid' }),
      makeItem({ title: 'B', notes: 'still pending' }),
      makeItem({ title: 'C', notes: 'invoice sent' }),
      makeItem({ title: 'D', notes: 'paid in full' }),
      makeItem({ title: 'E', notes: 'pending approval' }),
    ]
    const draft = detectStatusInNotes(baseContext({ items }))
    expect(draft).not.toBeNull()
    expect(draft!.dedupeKey).toBe('status-in-notes')
  })

  it('returns null on clean notes', () => {
    const items = [
      makeItem({ title: 'A', notes: 'called supplier about shipment' }),
      makeItem({ title: 'B', notes: 'updated spreadsheet columns' }),
      makeItem({ title: 'C', notes: 'meeting notes from Tuesday' }),
      makeItem({ title: 'D', notes: 'filed paperwork at office' }),
    ]
    expect(detectStatusInNotes(baseContext({ items }))).toBeNull()
  })

  it('returns null below threshold', () => {
    const items = [
      makeItem({ title: 'A', notes: 'paid' }),
      makeItem({ title: 'B', notes: 'pending' }),
      makeItem({ title: 'C', notes: 'sent' }),
    ]
    expect(detectStatusInNotes(baseContext({ items }))).toBeNull()
  })

  it('returns null when recent suggestion blocks dedupe', () => {
    const items = Array.from({ length: 6 }, (_, i) =>
      makeItem({ title: `T${i}`, notes: 'paid' })
    )
    const recent = [makeSuggestion({ dedupeKey: 'status-in-notes' })]
    expect(detectStatusInNotes(baseContext({ items, recentSuggestions: recent }))).toBeNull()
  })

  it('never includes notes field mutations in operations', () => {
    const items = Array.from({ length: 5 }, () =>
      makeItem({ title: 'Job', notes: 'marked paid today' })
    )
    const draft = detectStatusInNotes(baseContext({ items }))
    expect(draft).not.toBeNull()
    for (const op of draft!.operations) {
      expect(op.op).not.toBe('update_field')
      if (op.op === 'backfill_field') {
        expect(op.key).toBe('status')
      }
    }
  })

  it('returns null when a status select field already exists', () => {
    const items = Array.from({ length: 6 }, () =>
      makeItem({ title: 'Job', notes: 'paid' })
    )
    const fields = [
      makeField({ key: 'status', label: 'Status', type: 'select', options: ['paid'] }),
    ]
    expect(detectStatusInNotes(baseContext({ items, fields }))).toBeNull()
  })

  it('stable dedupeKey across runs', () => {
    const ctx = baseContext({
      items: Array.from({ length: 5 }, () => makeItem({ title: 'x', notes: 'paid' })),
    })
    expect(detectStatusInNotes(ctx)!.dedupeKey).toBe(detectStatusInNotes(ctx)!.dedupeKey)
  })
})
