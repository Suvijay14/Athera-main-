import { describe, expect, it } from 'vitest'

import { hasRetentionDecisionLogged } from '@/lib/adaptation/retention-cron'
import {
  determineRetention,
  isEligibleForRetentionEvaluation,
  RETENTION_EVALUATION_DAYS,
  RETENTION_FILL_THRESHOLD,
} from '@/lib/adaptation/retention'
import type { Operation } from '@/lib/adaptation/types'
import type {
  AppEvent,
  ChangeLogEntry,
  FieldDefinition,
  RecurrenceRule,
  ViewDefinition,
  WorkItem,
} from '@/lib/db/schemas'

const now = new Date('2026-03-20T12:00:00.000Z')
const appliedAt = '2026-03-01T12:00:00.000Z'

function entry(operations: Operation[], undoneAt: string | null = null): ChangeLogEntry {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    workspaceId: '00000000-0000-4000-8000-000000000002',
    suggestionId: '00000000-0000-4000-8000-000000000003',
    operations,
    inverseOperations: [],
    appliedAt,
    undoneAt,
  }
}

function baseInput(overrides: Partial<Parameters<typeof determineRetention>[0]> = {}) {
  return {
    changeLogEntry: entry([]),
    suggestionType: 'test',
    recentEvents: [] as AppEvent[],
    items: [] as WorkItem[],
    fields: [] as FieldDefinition[],
    views: [] as ViewDefinition[],
    recurrenceRules: [] as RecurrenceRule[],
    now,
    ...overrides,
  }
}

describe('isEligibleForRetentionEvaluation', () => {
  it('excludes undone changes', () => {
    expect(
      isEligibleForRetentionEvaluation(
        entry([], '2026-03-10T00:00:00.000Z'),
        now
      )
    ).toBe(false)
  })

  it('excludes changes younger than 14 days', () => {
    expect(
      isEligibleForRetentionEvaluation(
        { ...entry([]), appliedAt: '2026-03-15T00:00:00.000Z' },
        now
      )
    ).toBe(false)
  })
})

describe('determineRetention', () => {
  it('returns not_yet_evaluable before 14 days', () => {
    const young = { ...entry([]), appliedAt: '2026-03-15T00:00:00.000Z' }
    expect(
      determineRetention(
        baseInput({
          changeLogEntry: young,
        })
      )
    ).toBe('not_yet_evaluable')
  })

  it('throws when called on undone changes', () => {
    expect(() =>
      determineRetention(
        baseInput({
          changeLogEntry: entry([], '2026-03-02T00:00:00.000Z'),
        })
      )
    ).toThrow(/undone/)
  })

  it('create_view retained when view_opened matches', () => {
    const viewId = '00000000-0000-4000-8000-000000000010'
    const ops: Operation[] = [
      { op: 'create_view', view: { name: 'Clients', type: 'grouped', groupByField: 'client' } },
    ]
    const views: ViewDefinition[] = [
      {
        id: viewId,
        workspaceId: '00000000-0000-4000-8000-000000000002',
        name: 'Clients',
        type: 'grouped',
        groupByField: 'client',
        colorByField: null,
        calendarRange: null,
        filters: {},
        visible: true,
        position: 0,
        source: 'athera',
        createdAt: '2026-03-01T12:05:00.000Z',
      },
    ]
    const events: AppEvent[] = [
      {
        id: '00000000-0000-4000-8000-000000000020',
        workspaceId: '00000000-0000-4000-8000-000000000002',
        userId: '00000000-0000-4000-8000-000000000099',
        name: 'view_opened',
        props: { viewId, viewType: 'grouped' },
        createdAt: '2026-03-05T00:00:00.000Z',
      },
    ]
    expect(
      determineRetention(
        baseInput({
          changeLogEntry: entry(ops),
          views,
          recentEvents: events,
        })
      )
    ).toBe('retained')
  })

  it('create_view abandoned without view_opened', () => {
    const ops: Operation[] = [
      { op: 'create_view', view: { name: 'Clients', type: 'grouped', groupByField: 'client' } },
    ]
    expect(
      determineRetention(
        baseInput({
          changeLogEntry: entry(ops),
          views: [
            {
              id: '00000000-0000-4000-8000-000000000010',
              workspaceId: '00000000-0000-4000-8000-000000000002',
              name: 'Clients',
              type: 'grouped',
              groupByField: 'client',
              colorByField: null,
              calendarRange: null,
              filters: {},
              visible: true,
              position: 0,
              source: 'athera',
              createdAt: '2026-03-01T12:05:00.000Z',
            },
          ],
        })
      )
    ).toBe('abandoned')
  })

  it('field backfill retained above fill threshold', () => {
    const ops: Operation[] = [
      { op: 'create_field', field: { key: 'client', label: 'Client', type: 'text' } },
      {
        op: 'backfill_field',
        key: 'client',
        values: {
          '00000000-0000-4000-8000-000000000101': 'A',
          '00000000-0000-4000-8000-000000000102': 'B',
        },
      },
    ]
    const items: WorkItem[] = [
      {
        id: '00000000-0000-4000-8000-000000000101',
        workspaceId: '00000000-0000-4000-8000-000000000002',
        spaceId: '00000000-0000-4000-8000-000000000010',
        title: 'One',
        dueDate: null,
        notes: null,
        startAt: null,
        endAt: null,
        allDay: false,
        source: 'manual',
        spaceConfidence: null,
        archivedAt: null,
      completedAt: null,
      recurrenceId: null,
      recurrenceInstanceDate: null,
      externalProvider: null,
      externalId: null,
      data: { client: 'A' },
        createdAt: '2026-03-02T00:00:00.000Z',
        updatedAt: '2026-03-02T00:00:00.000Z',
      },
      {
        id: '00000000-0000-4000-8000-000000000102',
        workspaceId: '00000000-0000-4000-8000-000000000002',
        spaceId: '00000000-0000-4000-8000-000000000010',
        title: 'Two',
        dueDate: null,
        notes: null,
        startAt: null,
        endAt: null,
        allDay: false,
        source: 'manual',
        spaceConfidence: null,
        archivedAt: null,
      completedAt: null,
      recurrenceId: null,
      recurrenceInstanceDate: null,
      externalProvider: null,
      externalId: null,
      data: { client: 'B' },
        createdAt: '2026-03-03T00:00:00.000Z',
        updatedAt: '2026-03-03T00:00:00.000Z',
      },
    ]
    expect(
      determineRetention(
        baseInput({
          changeLogEntry: entry(ops),
          items,
        })
      )
    ).toBe('retained')
    expect(RETENTION_FILL_THRESHOLD).toBe(0.5)
  })

  it('field backfill abandoned below fill threshold', () => {
    const ops: Operation[] = [
      { op: 'create_field', field: { key: 'client', label: 'Client', type: 'text' } },
      { op: 'backfill_field', key: 'client', values: {} },
    ]
    const items: WorkItem[] = [
      {
        id: '00000000-0000-4000-8000-000000000101',
        workspaceId: '00000000-0000-4000-8000-000000000002',
        spaceId: '00000000-0000-4000-8000-000000000010',
        title: 'One',
        dueDate: null,
        notes: null,
        startAt: null,
        endAt: null,
        allDay: false,
        source: 'manual',
        spaceConfidence: null,
        archivedAt: null,
      completedAt: null,
      recurrenceId: null,
      recurrenceInstanceDate: null,
      externalProvider: null,
      externalId: null,
      data: {},
        createdAt: '2026-03-02T00:00:00.000Z',
        updatedAt: '2026-03-02T00:00:00.000Z',
      },
      {
        id: '00000000-0000-4000-8000-000000000102',
        workspaceId: '00000000-0000-4000-8000-000000000002',
        spaceId: '00000000-0000-4000-8000-000000000010',
        title: 'Two',
        dueDate: null,
        notes: null,
        startAt: null,
        endAt: null,
        allDay: false,
        source: 'manual',
        spaceConfidence: null,
        archivedAt: null,
      completedAt: null,
      recurrenceId: null,
      recurrenceInstanceDate: null,
      externalProvider: null,
      externalId: null,
      data: {},
        createdAt: '2026-03-03T00:00:00.000Z',
        updatedAt: '2026-03-03T00:00:00.000Z',
      },
      {
        id: '00000000-0000-4000-8000-000000000103',
        workspaceId: '00000000-0000-4000-8000-000000000002',
        spaceId: '00000000-0000-4000-8000-000000000010',
        title: 'Three',
        dueDate: null,
        notes: null,
        startAt: null,
        endAt: null,
        allDay: false,
        source: 'manual',
        spaceConfidence: null,
        archivedAt: null,
      completedAt: null,
      recurrenceId: null,
      recurrenceInstanceDate: null,
      externalProvider: null,
      externalId: null,
      data: { client: 'x' },
        createdAt: '2026-03-04T00:00:00.000Z',
        updatedAt: '2026-03-04T00:00:00.000Z',
      },
    ]
    expect(
      determineRetention(
        baseInput({
          changeLogEntry: entry(ops),
          items,
        })
      )
    ).toBe('abandoned')
  })

  it('recurrence retained while rule active', () => {
    const ops: Operation[] = [
      {
        op: 'create_recurrence_rule',
        rule: {
          spaceId: '00000000-0000-4000-8000-000000000010',
          templateItem: { title: 'Send invoices', notes: '' },
          freq: 'weekly',
          intervalCount: 1,
          byWeekday: [1],
          timeOfDay: null,
          startsOn: '2026-03-01',
          endsOn: null,
          exceptions: [],
        },
      },
    ]
    const rules: RecurrenceRule[] = [
      {
        id: '00000000-0000-4000-8000-000000000030',
        workspaceId: '00000000-0000-4000-8000-000000000002',
        spaceId: '00000000-0000-4000-8000-000000000010',
        templateItem: { title: 'Send invoices', notes: '' },
        freq: 'weekly',
        intervalCount: 1,
        byWeekday: [1],
        timeOfDay: null,
        durationMin: null,
        startsOn: '2026-03-01',
        endsOn: null,
        exceptions: [],
        active: true,
        source: 'athera',
        createdAt: '2026-03-01T12:01:00.000Z',
      },
    ]
    expect(
      determineRetention(
        baseInput({
          changeLogEntry: entry(ops),
          recurrenceRules: rules,
        })
      )
    ).toBe('retained')
  })

  it('hide field retained while still hidden', () => {
    const ops: Operation[] = [
      { op: 'set_field_visibility', key: 'legacy_ref', visible: false },
    ]
    const fields: FieldDefinition[] = [
      {
        id: '00000000-0000-4000-8000-000000000040',
        workspaceId: '00000000-0000-4000-8000-000000000002',
        key: 'legacy_ref',
        label: 'Legacy',
        type: 'text',
        options: [],
        entityKind: null,
        visible: false,
        position: 0,
        source: 'user',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]
    expect(
      determineRetention(
        baseInput({
          changeLogEntry: entry(ops),
          fields,
        })
      )
    ).toBe('retained')
  })
})

describe('hasRetentionDecisionLogged', () => {
  it('skips when retained or abandoned already logged', () => {
    const events: AppEvent[] = [
      {
        id: '1',
        workspaceId: 'w',
        userId: 'u',
        name: 'adaptation_retained',
        props: { suggestion_id: 'sug-1' },
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]
    expect(hasRetentionDecisionLogged(events, 'sug-1')).toBe(true)
    expect(hasRetentionDecisionLogged(events, 'sug-2')).toBe(false)
  })
})

describe('constants', () => {
  it('uses 14 day evaluation window', () => {
    expect(RETENTION_EVALUATION_DAYS).toBe(14)
  })
})
