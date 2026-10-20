import Link from 'next/link'

import { getSuggestionTypeMetrics } from '@/lib/db/metrics'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/supabase/get-current-workspace'

export default async function WorkspaceMetricsPage() {
  const { workspace, user } = await getCurrentWorkspace()
  const client = await createClient()
  const rows = await getSuggestionTypeMetrics(client, workspace.id)

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-8">
      <header className="mb-6">
        <Link
          href="/workspace"
          className="text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          ← Back to workspace
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-on-surface">Adaptation metrics</h1>
        <p className="mt-1 text-sm text-on-surface-variant">Signed in as {user.email}</p>
      </header>

      {rows.length === 0 ? (
        <p className="text-sm text-on-surface-variant">No suggestions recorded yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border-serenity">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface-container-low text-on-surface-variant">
              <tr>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Shown</th>
                <th className="px-3 py-2 font-medium">Accepted</th>
                <th className="px-3 py-2 font-medium">Dismissed</th>
                <th className="px-3 py-2 font-medium">Undone</th>
                <th className="px-3 py-2 font-medium">Accept rate</th>
                <th className="px-3 py-2 font-medium">Undo rate</th>
                <th className="px-3 py-2 font-medium">14d retention</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.type} className="border-t border-border-serenity">
                  <td className="px-3 py-2 font-mono text-xs">{row.type}</td>
                  <td className="px-3 py-2">{row.shown}</td>
                  <td className="px-3 py-2">{row.accepted}</td>
                  <td className="px-3 py-2">{row.dismissed}</td>
                  <td className="px-3 py-2">{row.undone}</td>
                  <td className="px-3 py-2">{row.acceptanceRate}</td>
                  <td className="px-3 py-2">{row.undoRate}</td>
                  <td className="px-3 py-2">{row.retentionRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
