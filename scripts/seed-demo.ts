/**
 * Seeds a workspace so all four adaptation detectors can fire.
 *
 * Usage:
 *   npm run seed:demo -- --workspace-id=<uuid>
 *   npm run seed:demo -- --user-id=<auth-users-uuid>
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */
import { config } from 'dotenv'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { addDays, subDays } from 'date-fns'

config({ path: resolve(process.cwd(), '.env.local') })

function arg(name: string): string | undefined {
  const prefix = `--${name}=`
  return process.argv.find((a) => a.startsWith(prefix))?.slice(prefix.length)
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  const client = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  let workspaceId = arg('workspace-id')
  const userId = arg('user-id')

  if (!workspaceId) {
    if (!userId) {
      console.error('Provide --workspace-id=<uuid> or --user-id=<uuid> (creates workspace for user).')
      process.exit(1)
    }
    const { error: wsErr } = await client.from('workspaces').insert({ owner_id: userId })
    if (wsErr && wsErr.code !== '23505') {
      throw wsErr
    }
    const { data: ws, error: loadErr } = await client
      .from('workspaces')
      .select('id')
      .eq('owner_id', userId)
      .single()
    if (loadErr || !ws) {
      throw loadErr ?? new Error('Workspace not found after create')
    }
    workspaceId = ws.id
    console.log(`Created/found workspace for user ${userId}`)
  }

  const { data: existingSpace } = await client
    .from('spaces')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('is_default', true)
    .maybeSingle()

  let defaultSpaceId = existingSpace?.id
  if (!defaultSpaceId) {
    const { data: newSpace, error: spaceErr } = await client
      .from('spaces')
      .insert({ workspace_id: workspaceId, name: 'My space', is_default: true, sort_order: 0 })
      .select('id')
      .single()
    if (spaceErr) {
      throw spaceErr
    }
    defaultSpaceId = newSpace.id
  }

  const anchor = new Date('2026-02-01T12:00:00.000Z')
  const fieldCreatedAt = subDays(anchor, 20).toISOString()
  const itemBase = subDays(anchor, 10)

  const { data: unusedField, error: fieldErr } = await client
    .from('field_definitions')
    .insert({
      workspace_id: workspaceId,
      key: 'vendor_code',
      label: 'Vendor code',
      type: 'text',
      options: [],
      visible: true,
      position: 99,
      source: 'user',
      created_at: fieldCreatedAt,
    })
    .select('id')
    .single()

  if (fieldErr && fieldErr.code !== '23505') {
    throw fieldErr
  }
  if (unusedField?.id) {
    await client
      .from('field_definitions')
      .update({ created_at: fieldCreatedAt })
      .eq('id', unusedField.id)
  }

  const riveraTitles = [
    'Follow up - Rivera Plumbing',
    'Rivera Plumbing: send quote',
    'Rivera Plumbing - order parts',
    'Rivera Plumbing - phone call',
    'Rivera Plumbing: schedule visit',
    'Rivera Plumbing - invoice review',
    'Rivera Plumbing: warranty check',
  ]

  const statusNotes = [
    { title: 'Payment A', notes: 'marked paid' },
    { title: 'Payment B', notes: 'still pending' },
    { title: 'Payment C', notes: 'invoice sent to client' },
    { title: 'Payment D', notes: 'paid in full' },
    { title: 'Payment E', notes: 'pending approval' },
    { title: 'Payment F', notes: 'sent reminder' },
  ]

  const recurring = [0, 7, 14, 21].map((days) => ({
    title: 'Send invoices',
    notes: 'Monthly billing run',
    created_at: addDays(itemBase, days).toISOString(),
  }))

  const fillerCount = 25 - riveraTitles.length - statusNotes.length - recurring.length
  const filler = Array.from({ length: Math.max(0, fillerCount) }, (_, i) => ({
    title: `General admin ${i + 1}`,
    notes: 'Routine office work',
    created_at: addDays(itemBase, i).toISOString(),
  }))

  const rows = [
    ...riveraTitles.map((title, i) => ({
      workspace_id: workspaceId,
      space_id: defaultSpaceId,
      title,
      notes: null as string | null,
      data: {},
      created_at: addDays(itemBase, i).toISOString(),
      updated_at: addDays(itemBase, i).toISOString(),
    })),
    ...statusNotes.map((row, i) => ({
      workspace_id: workspaceId,
      space_id: defaultSpaceId,
      title: row.title,
      notes: row.notes,
      data: {},
      created_at: addDays(itemBase, 5 + i).toISOString(),
      updated_at: addDays(itemBase, 5 + i).toISOString(),
    })),
    ...recurring.map((row) => ({
      workspace_id: workspaceId,
      space_id: defaultSpaceId,
      title: row.title,
      notes: row.notes,
      data: {},
      created_at: row.created_at,
      updated_at: row.created_at,
    })),
    ...filler.map((row) => ({
      workspace_id: workspaceId,
      space_id: defaultSpaceId,
      title: row.title,
      notes: row.notes,
      data: {},
      created_at: row.created_at,
      updated_at: row.created_at,
    })),
  ]

  const { error: itemsErr } = await client.from('work_items').insert(rows)
  if (itemsErr) {
    throw itemsErr
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001'
  console.log('\nDemo seed complete')
  console.log(`  Workspace ID: ${workspaceId}`)
  console.log(`  Work items inserted: ${rows.length}`)
  console.log(`  Unused field: vendor_code (created ${fieldCreatedAt.slice(0, 10)})`)
  console.log(`  Rivera Plumbing titles: ${riveraTitles.length}`)
  console.log(`  Status-note items: ${statusNotes.length}`)
  console.log(`  Recurring "Send invoices" rows: ${recurring.length}`)
  console.log(`\nVisit: ${baseUrl}/workspace`)
  console.log('\nRun adaptation: npm run adaptation:run --', workspaceId)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
