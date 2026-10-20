import { describe, expect, it } from 'vitest'

import { describe as describeOp } from '@/lib/adaptation/operations'
import type { Operation } from '@/lib/adaptation/types'

describe('describe()', () => {
  it('covers every operation variant', () => {
    const samples: Operation[] = [
      { op: 'create_field', field: { key: 'client', label: 'Client', type: 'text' } },
      { op: 'delete_field', key: 'client' },
      { op: 'set_field_visibility', key: 'status', visible: false },
      { op: 'update_field', key: 'status', patch: { label: 'State' } },
      {
        op: 'create_view',
        view: { name: 'Clients', type: 'grouped', groupByField: 'client' },
      },
      { op: 'delete_view', viewId: '00000000-0000-4000-8000-000000000001' },
      {
        op: 'backfill_field',
        key: 'client',
        values: { '00000000-0000-4000-8000-000000000002': 'Acme' },
      },
      {
        op: 'create_recurrence_rule',
        rule: {
          spaceId: '00000000-0000-4000-8000-000000000010',
          templateItem: { title: 'Send invoices' },
          freq: 'weekly',
          intervalCount: 1,
          byWeekday: [1],
          timeOfDay: null,
          startsOn: '2026-10-17',
        },
      },
      { op: 'delete_recurrence_rule', ruleId: '00000000-0000-4000-8000-000000000003' },
    ]
    for (const op of samples) {
      expect(describeOp(op).length).toBeGreaterThan(0)
    }
  })
})
