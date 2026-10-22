'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { scheduleAdaptation } from '@/lib/adaptation/schedule-adaptation'
import { createWorkItemAction } from '@/app/workspace/actions'
import { listFields } from '@/lib/db/fields'
import { entityFieldKeys } from '@/lib/workspace/entity-items'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/supabase/get-current-workspace'

const confirmRowSchema = z.object({
  title: z.string().trim().min(1),
  spaceId: z.string().uuid(),
  dueDate: z.string().nullable().optional(),
  startAt: z.string().nullable().optional(),
  endAt: z.string().nullable().optional(),
  allDay: z.boolean().optional(),
  entityId: z.string().uuid().nullable().optional(),
})

const confirmSchema = z.object({
  rows: z.array(confirmRowSchema).min(1),
})

export type PasteWeekConfirmResult =
  | { ok: true; createdCount: number }
  | { ok: false; code: 'upgrade_required'; message: string }
  | { ok: false; code: 'validation'; message: string }

export async function confirmPasteWeekAction(raw: z.infer<typeof confirmSchema>): Promise<PasteWeekConfirmResult> {
  const parsed = confirmSchema.parse(raw)
  const { workspace } = await getCurrentWorkspace()
  const client = await createClient()
  const fields = await listFields(client, workspace.id)
  const keys = entityFieldKeys(fields)
  const primaryEntityKey = keys[0] ?? null

  let createdCount = 0
  for (const row of parsed.rows) {
    const data: Record<string, unknown> = {}
    if (primaryEntityKey && row.entityId) {
      data[primaryEntityKey] = row.entityId
    }

    const result = await createWorkItemAction({
      title: row.title,
      spaceId: row.spaceId,
      dueDate: row.dueDate ?? null,
      startAt: row.startAt ?? null,
      endAt: row.endAt ?? null,
      allDay: row.allDay ?? false,
      data,
      source: 'import',
    })
    if (!result.ok) {
      if (createdCount === 0) {
        return { ok: false, code: 'upgrade_required', message: result.message }
      }
      break
    }
    createdCount += 1
  }

  scheduleAdaptation(client, workspace.id)
  revalidatePath('/workspace', 'layout')
  revalidatePath('/')
  revalidatePath('/workspace/paste-week')
  return { ok: true, createdCount }
}
