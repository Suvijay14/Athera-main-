import { NextResponse } from 'next/server'

import { isSupabaseConfigured } from '@/lib/supabase/env'

/** Instant env check — no Supabase network calls. */
export async function GET() {
  return NextResponse.json({
    supabaseConfigured: isSupabaseConfigured(),
  })
}
