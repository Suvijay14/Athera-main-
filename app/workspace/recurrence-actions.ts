'use server'

import { format } from 'date-fns'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { applyOperations } from '@/lib/adaptation/apply'
import { materializeInstance } from '@/lib/adaptation/materialize-instance'
import type { Operation } from '@/lib/adaptation/types'
import { getRecurrenceRuleById } from '@/lib/db/recurrence-rules'
import { updateItem } from '@/lib/db/items'
import { updateWorkItemInputSchema } from '@/lib/db/schemas'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/supabase/get-current-workspace'
import { parseVirtualRecurrenceId } from '@/lib/workspace/recurrence-types'

const scopeSchema = z.enum(['this_one', 'all_future'])

const editRecurrenceSchema = z.object({
  itemId: z.string().min(1),
  scope: scopeSchema,
  patch: updateWorkItemInputSchema,
})

function revalidateWorkspace() {
  revalidatePath('/workspace')
  revalidatePath('/workspace/spaces/[spaceId]', 'page')
}

export async function saveRecurringItemEditAction(
  raw: z.infer<typeof editRecurrenceSchema>
): Promise<{ ok: true; itemId: string } | { ok: false; message: string }> {
  const { itemId, scope, patch } = editRecurrenceSchema.parse(raw)
  try {
    const { workspace } = await getCurrentWorkspace()
    const client = await createClient()

    const virtual = parseVirtualRecurrenceId(itemId)
    let workItemId = itemId
    let instanceDate: string | null = null
    let recurrenceId: string | null = null

    if (virtual) {
      recurrenceId = virtual.recurrenceId
      instanceDate = virtual.instanceDate
      const materialized = await materializeInstance(
        client,
        workspace.id,
        virtual.recurrenceId,
        virtual.instanceDate
      )
      workItemId = materialized.id
    } else {
      const { data: row } = await client
        .from('work_items')
        .select('recurrence_id, recurrence_instance_date')
        .eq('id', itemId)
        .eq('workspace_id', workspace.id)
        .maybeSingle()
      recurrenceId = (row?.recurrence_id as string | null) ?? null
      instanceDate = (row?.recurrence_instance_date as string | null) ?? null
    }

    await updateItem(client, workspace.id, workItemId, patch)

    if (!recurrenceId) {
      revalidateWorkspace()
      return { ok: true, itemId: workItemId }
    }

    const ops: Operation[] = []
    if (scope === 'this_one' && instanceDate) {
      ops.push({ op: 'set_recurrence_exception', ruleId: recurrenceId, date: instanceDate })
    }
    if (scope === 'all_future') {
      const today = format(new Date(), 'yyyy-MM-dd')
      ops.push({ op: 'end_recurrence_rule', ruleId: recurrenceId, endsOn: today })
      const rule = await getRecurrenceRuleById(client, workspace.id, recurrenceId)
      if (rule) {
        ops.push({
          op: 'create_recurrence_rule',
          rule: {
            spaceId: rule.spaceId,
            templateItem: {
              ...rule.templateItem,
              title: patch.title ?? rule.templateItem.title,
              notes: patch.notes ?? rule.templateItem.notes,
            },
            freq: 'weekly',
            intervalCount: rule.intervalCount,
            byWeekday: rule.byWeekday,
            timeOfDay: rule.timeOfDay,
            durationMin: rule.durationMin,
            startsOn: today,
            endsOn: null,
            exceptions: [],
          },
        })
      }
    }
    if (ops.length > 0) {
      await applyOperations(client, workspace.id, ops)
    }

    revalidateWorkspace()
    return { ok: true, itemId: workItemId }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Save failed' }
  }
}

export async function completeRecurringItemAction(
  itemId: string
): Promise<{ ok: boolean; message?: string }> {
  try {
    const { workspace } = await getCurrentWorkspace()
    const client = await createClient()
    const virtual = parseVirtualRecurrenceId(itemId)
    let workItemId = itemId
    if (virtual) {
      const materialized = await materializeInstance(
        client,
        workspace.id,
        virtual.recurrenceId,
        virtual.instanceDate
      )
      workItemId = materialized.id
    }
    await updateItem(client, workspace.id, workItemId, {
      completedAt: new Date().toISOString(),
    })
    revalidateWorkspace()
    return { ok: true }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Complete failed' }
  }
}

export async function deleteRecurringInstanceAction(
  itemId: string
): Promise<{ ok: boolean; message?: string }> {
  try {
    const { workspace } = await getCurrentWorkspace()
    const client = await createClient()
    const virtual = parseVirtualRecurrenceId(itemId)
    if (virtual) {
      await applyOperations(client, workspace.id, [
        {
          op: 'set_recurrence_exception',
          ruleId: virtual.recurrenceId,
          date: virtual.instanceDate,
        },
      ])
      revalidateWorkspace()
      return { ok: true }
    }
    const { data: row } = await client
      .from('work_items')
      .select('recurrence_id, recurrence_instance_date')
      .eq('id', itemId)
      .eq('workspace_id', workspace.id)
      .maybeSingle()
    const recurrenceId = row?.recurrence_id as string | null
    const instanceDate = row?.recurrence_instance_date as string | null
    if (recurrenceId && instanceDate) {
      await applyOperations(client, workspace.id, [
        { op: 'set_recurrence_exception', ruleId: recurrenceId, date: instanceDate },
        { op: 'delete_work_item', itemId },
      ])
    } else {
      await applyOperations(client, workspace.id, [{ op: 'delete_work_item', itemId }])
    }
    revalidateWorkspace()
    return { ok: true }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Delete failed' }
  }
}
