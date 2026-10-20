import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'

function devOnly() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return null
}

/** Dev connectivity check against real workspace schema (no smoke_messages table). */
export async function GET() {
  const blocked = devOnly()
  if (blocked) return blocked

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error:
          'Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local',
      },
      { status: 503 }
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase.from('workspaces').select('id').limit(1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 })
  }

  return NextResponse.json({ ok: true, workspaceRowsVisible: (data ?? []).length })
}

export async function POST() {
  const blocked = devOnly()
  if (blocked) return blocked

  return NextResponse.json(
    {
      error: 'POST disabled. Use GET to verify Supabase connectivity.',
    },
    { status: 405 }
  )
}
