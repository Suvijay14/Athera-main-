/**
 * One-off: run runAdaptation for a workspace (service role).
 * Usage: npm run adaptation:run -- <workspace-id> [--debug]
 */
import { config } from 'dotenv'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

config({ path: resolve(process.cwd(), '.env.local') })

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== '--debug')
  const debug = process.argv.includes('--debug')
  const workspaceId = args[0]
  if (!workspaceId) {
    console.error('Usage: npm run adaptation:run -- <workspace-id> [--debug]')
    process.exit(1)
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase env vars')
  }

  const client = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { runAdaptationDiagnosis } = await import('../lib/adaptation/diagnose-adaptation')
  const { runAdaptation } = await import('../lib/adaptation/engine')

  if (debug) {
    console.log(await runAdaptationDiagnosis(client, workspaceId))
    console.log('')
  }

  const suggestion = await runAdaptation(client, workspaceId)
  if (!suggestion) {
    console.log('No new suggestion inserted.')
    if (!debug) {
      console.log('')
      console.log(await runAdaptationDiagnosis(client, workspaceId))
    }
    return
  }
  console.log(JSON.stringify(suggestion, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
