import { NextResponse } from 'next/server'
import { installKokoro } from '@/lib/server/kokoro-setup'

export async function POST() {
  const result = await installKokoro()
  return NextResponse.json(result, { status: result.ok ? 200 : 503 })
}
