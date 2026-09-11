import { NextResponse } from 'next/server'
import { kokoroStop } from '@/lib/server/kokoro'

export async function POST() {
  await kokoroStop()
  return NextResponse.json({ status: 'stopped' })
}
