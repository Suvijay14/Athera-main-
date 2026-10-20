import 'server-only'

import { createSpace, listSpaces } from '@/lib/db/spaces'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/supabase/get-current-workspace'
import type { PendingLifeAction } from '@/lib/types'

import { normalizeActionType } from './life-reasoning'

/** Maps confirmed voice "life actions" to Supabase workspace spaces (Phase 0). */
export async function executeLifeActionInWorkspace(
  result: PendingLifeAction
): Promise<string> {
  const actionType = normalizeActionType(result.actionType)
  const { workspace } = await getCurrentWorkspace()
  const client = await createClient()

  switch (actionType) {
    case 'create_space': {
      const name = (result.actionTarget.trim() || result.signal).slice(0, 80)
      if (!name) {
        return 'Done. Noted.'
      }
      const existing = await listSpaces(client, workspace.id, { includeArchived: true })
      const dup = existing.find((s) => s.name.toLowerCase() === name.toLowerCase())
      if (dup) {
        return `You already have a space called “${dup.name}”. Open it from the sidebar.`
      }
      await createSpace(client, workspace.id, {
        name,
        sortOrder: existing.length,
      })
      return `Created space “${name}” in your workspace. You'll find it in the sidebar.`
    }
    case 'add_to_space':
    case 'scan_files':
      return "File scanning into spaces isn't wired to the workspace yet. Create tasks or paste your week in a space instead."
    case 'archive_space':
      return `${result.actionTarget || 'That space'} noted. Archive spaces from the workspace sidebar when you're ready.`
    default:
      return 'Noted.'
  }
}
