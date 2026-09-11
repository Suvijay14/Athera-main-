import { NextResponse } from 'next/server'
import { installKokoro, startKokoroServer } from '@/lib/server/kokoro-setup'

export async function POST(req: Request) {
  let install = false
  try {
    const body = (await req.json()) as { install?: boolean }
    install = body.install ?? false
  } catch {
    // empty POST body is fine
  }

  if (install) {
    const installed = await installKokoro()
    if (!installed.ok) {
      return NextResponse.json(installed, { status: 503 })
    }
  }

  const result = await startKokoroServer()
  return NextResponse.json(result, { status: result.ok ? 200 : 503 })
}
