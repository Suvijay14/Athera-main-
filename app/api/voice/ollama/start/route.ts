import { NextResponse } from 'next/server'
import { startOllamaServer } from '@/lib/server/ollama-setup'

export async function POST() {
  const result = await startOllamaServer()
  return NextResponse.json(result, { status: result.ok ? 200 : 503 })
}
