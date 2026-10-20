'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { scheduleAdaptation } from '@/lib/adaptation/schedule-adaptation'
import { assertCanCreateItem } from '@/app/workspace/account-actions'
import { createItem } from '@/lib/db/items'
import { track } from '@/lib/events'
import { parsePasteWeekLines } from '@/lib/workspace/paste-week'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/supabase/get-current-workspace'

const pasteSchema = z.object({
  spaceId: z.string().uuid(),
  text: z.string().min(1),
})

export type PasteWeekActionResult =
  | { ok: true; createdCount: number }
  | { ok: false; code: 'upgrade_required'; message: string }
  | { ok: false; code: 'validation'; message: string }

export async function pasteWeekAction(raw: z.infer<typeof pasteSchema>): Promise<PasteWeekActionResult> {
  const parsed = pasteSchema.parse(raw)
  const { workspace, user } = await getCurrentWorkspace()
  const client = await createClient()
  const now = new Date()
  const rows = parsePasteWeekLines(parsed.text, now)

  if (rows.length === 0) {
    return { ok: false, code: 'validation', message: 'No lines to import.' }
  }

  let createdCount = 0
  for (const row of rows) {
    const gate = await assertCanCreateItem()
    if (!gate.ok) {
      if (createdCount === 0) {
        return { ok: false, code: 'upgrade_required', message: gate.message }
      }
      break
    }

    await createItem(client, workspace.id, {
      title: row.title,
      spaceId: parsed.spaceId,
      dueDate: row.dueDate,
      startAt: row.startAt,
      endAt: row.endAt,
      allDay: row.allDay,
      data: row.data ?? {},
      source: 'manual',
    })
    createdCount += 1

    await track(client, {
      workspaceId: workspace.id,
      userId: user.id,
      name: 'item_created',
      props: { method: 'paste' },
    })
  }

  scheduleAdaptation(client, workspace.id)
  revalidatePath('/workspace', 'layout')
  return { ok: true, createdCount }
}
