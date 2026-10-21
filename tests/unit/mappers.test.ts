import { describe, expect, it } from 'vitest'

import type { Database } from '@/lib/db/database.types'
import {
  mapAppEventRow,
  mapChangeLogRow,
  mapEntityRow,
  mapFieldDefinitionRow,
  mapRecurrenceRuleRow,
  mapSpaceRow,
  mapSuggestionRow,
  mapViewDefinitionRow,
  mapWorkItemRow,
  mapWorkspaceRow,
} from '@/lib/db/mappers'

describe('mappers round trip shape', () => {
  it('maps space row', () => {
    const row: Database['public']['Tables']['spaces']['Row'] = {
      id: '00000000-0000-4000-8000-000000000020',
      workspace_id: '00000000-0000-4000-8000-000000000001',
      name: 'My space',
      icon: null,
      color: null,
      sort_order: 0,
      is_default: true,
      archived_at: null,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    }
    expect(mapSpaceRow(row).isDefault).toBe(true)
  })

  it('maps entity row', () => {
    const row: Database['public']['Tables']['entities']['Row'] = {
      id: '00000000-0000-4000-8000-000000000021',
      workspace_id: '00000000-0000-4000-8000-000000000001',
      space_id: '00000000-0000-4000-8000-000000000020',
      kind: 'client',
      name: 'Rivera Plumbing',
      aliases: ['Rivera'],
      color: null,
      archived_at: null,
      last_activity_at: null,
      typical_gap_days: null,
      excluded_from_suggestions: false,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    }
    expect(mapEntityRow(row).aliases).toEqual(['Rivera'])
  })

  it('maps workspace row', () => {
    const row: Database['public']['Tables']['workspaces']['Row'] = {
      id: '00000000-0000-4000-8000-000000000001',
      owner_id: '00000000-0000-4000-8000-000000000002',
      name: 'My workspace',
      business_type: null,
      item_label: 'Task',
      onboarding_answers: { step: 1 },
      plan: 'free',
      subscription_status: 'active',
      stripe_customer_id: null,
      stripe_subscription_id: null,
      current_period_end: null,
      trial_ends_at: null,
      deleted_at: null,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    }
    const mapped = mapWorkspaceRow(row)
    expect(mapped.ownerId).toBe(row.owner_id)
    expect(mapped.onboardingAnswers).toEqual({ step: 1 })
  })

  it('maps field definition row', () => {
    const row: Database['public']['Tables']['field_definitions']['Row'] = {
      id: '00000000-0000-4000-8000-000000000003',
      workspace_id: '00000000-0000-4000-8000-000000000001',
      key: 'priority',
      label: 'Priority',
      type: 'select',
      options: ['low', 'high'],
      entity_kind: null,
      visible: true,
      position: 1,
      source: 'user',
      created_at: '2026-01-01T00:00:00.000Z',
    }
    expect(mapFieldDefinitionRow(row).options).toEqual(['low', 'high'])
  })

  it('maps work item row', () => {
    const row: Database['public']['Tables']['work_items']['Row'] = {
      id: '00000000-0000-4000-8000-000000000004',
      workspace_id: '00000000-0000-4000-8000-000000000001',
      space_id: '00000000-0000-4000-8000-000000000010',
      title: 'Example',
      due_date: '2026-10-10',
      notes: null,
      data: { priority: 'low' },
      start_at: null,
      end_at: null,
      all_day: false,
      archived_at: null,
      completed_at: null,
      recurrence_id: null,
      recurrence_instance_date: null,
      source: 'manual',
      element_kind: 'task',
      space_confidence: null,
      external_provider: null,
      external_id: null,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    }
    expect(mapWorkItemRow(row).data).toEqual({ priority: 'low' })
  })

  it('maps view definition row', () => {
    const row: Database['public']['Tables']['view_definitions']['Row'] = {
      id: '00000000-0000-4000-8000-000000000005',
      workspace_id: '00000000-0000-4000-8000-000000000001',
      name: 'Board',
      type: 'board',
      group_by_field: 'priority',
      color_by_field: null,
      calendar_range: null,
      filters: {},
      visible: true,
      position: 0,
      source: 'user',
      created_at: '2026-01-01T00:00:00.000Z',
    }
    expect(mapViewDefinitionRow(row).groupByField).toBe('priority')
  })

  it('maps recurrence rule row', () => {
    const row = {
      id: '00000000-0000-4000-8000-000000000006',
      workspace_id: '00000000-0000-4000-8000-000000000001',
      space_id: '00000000-0000-4000-8000-000000000010',
      template_item: { title: 'Weekly' },
      freq: 'weekly',
      interval_count: 1,
      by_weekday: [2],
      time_of_day: '17:00:00',
      duration_min: 60,
      starts_on: '2026-10-17',
      ends_on: null,
      exceptions: [],
      active: true,
      source: 'user',
      created_at: '2026-01-01T00:00:00.000Z',
    } as unknown as Database['public']['Tables']['recurrence_rules']['Row']
    expect(mapRecurrenceRuleRow(row).intervalCount).toBe(1)
  })

  it('maps suggestion row', () => {
    const row: Database['public']['Tables']['suggestions']['Row'] = {
      id: '00000000-0000-4000-8000-000000000007',
      workspace_id: '00000000-0000-4000-8000-000000000001',
      type: 'add_field',
      status: 'pending',
      reason: 'Because',
      evidence: {},
      confidence: 0.5,
      operations: [{ op: 'create_field' }],
      dedupe_key: 'k1',
      created_at: '2026-01-01T00:00:00.000Z',
      resolved_at: null,
    }
    expect(mapSuggestionRow(row).dedupeKey).toBe('k1')
  })

  it('maps change log row', () => {
    const row: Database['public']['Tables']['change_log']['Row'] = {
      id: '00000000-0000-4000-8000-000000000008',
      workspace_id: '00000000-0000-4000-8000-000000000001',
      suggestion_id: '00000000-0000-4000-8000-000000000007',
      operations: [],
      inverse_operations: [],
      applied_at: '2026-01-01T00:00:00.000Z',
      undone_at: null,
    }
    expect(mapChangeLogRow(row).suggestionId).toBe(row.suggestion_id)
  })

  it('maps app event row', () => {
    const row: Database['public']['Tables']['events']['Row'] = {
      id: '00000000-0000-4000-8000-000000000009',
      workspace_id: '00000000-0000-4000-8000-000000000001',
      user_id: '00000000-0000-4000-8000-000000000002',
      name: 'item_created',
      props: { suggestion_id: '00000000-0000-4000-8000-000000000007' },
      created_at: '2026-01-01T00:00:00.000Z',
    }
    expect(mapAppEventRow(row).name).toBe('item_created')
  })
})
