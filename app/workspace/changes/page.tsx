import Link from 'next/link'

import { ChangeHistoryList } from '@/components/adaptation/change-history-list'
import { listChangeLog } from '@/lib/db/change-log'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/supabase/get-current-workspace'

export default async function WorkspaceChangesPage() {
  const { workspace, user } = await getCurrentWorkspace()
  const client = await createClient()
  const entries = await listChangeLog(client, workspace.id)

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-8">
      <header className="mb-6">
        <Link
          href="/workspace"
          className="text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          ← Back to workspace
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-on-surface">What Athera changed</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Signed in as {user.email}
        </p>
      </header>
      <ChangeHistoryList entries={entries} />
    </main>
  )
}
