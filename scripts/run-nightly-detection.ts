/**
 * Manual nightly detection (service role). Requires CRON_SECRET or run via API route.
 *
 *   npx tsx scripts/run-nightly-detection.ts --workspace-id=<uuid>
 */
import { createAdminClient } from '../lib/supabase/admin'
import { runNightlyDetectionForWorkspace } from '../lib/adaptation/run-nightly-detection'

async function main() {
  const arg = process.argv.find((a) => a.startsWith('--workspace-id='))
  const workspaceId = arg?.split('=')[1]
  if (!workspaceId) {
    console.error('Usage: npx tsx scripts/run-nightly-detection.ts --workspace-id=<uuid>')
    process.exit(1)
  }
  const client = createAdminClient()
  const suggestion = await runNightlyDetectionForWorkspace(client, workspaceId)
  console.log(suggestion ? `Inserted suggestion ${suggestion.id} (${suggestion.type})` : 'No suggestion inserted')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
