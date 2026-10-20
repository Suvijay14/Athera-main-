/**
 * Insert "Hey" into smoke_messages (dev test).
 * Requires: .env.local + smoke_messages.sql applied in Supabase.
 *
 *   node scripts/supabase-smoke.mjs
 *   node scripts/supabase-smoke.mjs "Custom text"
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

function loadEnvLocal() {
  const path = resolve(process.cwd(), '.env.local')
  try {
    const raw = readFileSync(path, 'utf8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const value = trimmed.slice(eq + 1).trim()
      if (!(key in process.env)) process.env[key] = value
    }
  } catch {
    console.error('Missing .env.local — add Supabase URL and anon key first.')
    process.exit(1)
  }
}

loadEnvLocal()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
const message = process.argv[2]?.trim() || 'Hey'

if (!url || !key) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(url, key)
const { data, error } = await supabase
  .from('smoke_messages')
  .insert({ message })
  .select('id, message, created_at')
  .single()

if (error) {
  console.error('Insert failed:', error.message)
  console.error('→ Open Supabase Dashboard → SQL Editor → paste supabase/sql/smoke_messages.sql → Run')
  process.exit(1)
}

console.log('Inserted row:', data)

const { data: rows } = await supabase
  .from('smoke_messages')
  .select('id, message, created_at')
  .order('created_at', { ascending: false })
  .limit(5)

console.log('Latest rows:', rows)
