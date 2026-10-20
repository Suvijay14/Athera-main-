import 'server-only'

import { parseISO } from 'date-fns'

import { getRecurrenceRuleById } from '@/lib/db/recurrence-rules'
import type { DbClient } from '@/lib/db/db-client'
import { mapWorkItemRow } from '@/lib/db/mappers'
import { toJson } from '@/lib/db/json'
import type { WorkItem } from '@/lib/db/schemas'
import { generateInstances } from '@/lib/workspace/recurrence'

export async function materializeInstance(
  client: DbClient,
  workspaceId: string,
  recurrenceId: string,
  instanceDate: string
): Promise<WorkItem> {
  const { data: existing, error: findError } = await client
    .from('work_items')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('recurrence_id', recurrenceId)
    .eq('recurrence_instance_date', instanceDate)
    .maybeSingle()

  if (findError) {
    throw findError
  }
  if (existing) {
    return mapWorkItemRow(existing)
  }

  const rule = await getRecurrenceRuleById(client, workspaceId, recurrenceId)
  if (!rule || !rule.active) {
    throw new Error('Recurrence rule not found or inactive')
  }

  const day = parseISO(`${instanceDate}T12:00:00.000Z`)
  const [inst] = generateInstances(rule, day, day)
  if (!inst) {
    throw new Error('Invalid recurrence instance date')
  }

  const template = rule.templateItem
  const title = typeof template.title === 'string' ? template.title : inst.title
  const notes =
    typeof template.notes === 'string' ? template.notes : template.notes === null ? null : inst.notes
  const data =
    typeof template.data === 'object' && template.data !== null && !Array.isArray(template.data)
      ? (template.data as Record<string, unknown>)
      : inst.data

  const { data: inserted, error: insertError } = await client
    .from('work_items')
    .insert({
      workspace_id: workspaceId,
      space_id: rule.spaceId,
      title,
      notes,
      data: toJson(data),
      due_date: inst.dueDate,
      start_at: inst.startAt,
      end_at: inst.endAt,
      all_day: inst.allDay,
      source: 'recurrence',
      recurrence_id: recurrenceId,
      recurrence_instance_date: instanceDate,
    })
    .select('*')
    .single()

  if (insertError || !inserted) {
    throw insertError ?? new Error('Failed to materialize instance')
  }

  return mapWorkItemRow(inserted)
}
