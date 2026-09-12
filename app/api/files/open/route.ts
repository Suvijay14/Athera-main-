import { NextRequest, NextResponse } from 'next/server'
import { runTool, toolResultMessage } from '@/lib/server/tools'
import { safeUserPath } from '@/lib/server/path-utils'

export async function POST(req: NextRequest) {
  const { path: filePath } = (await req.json()) as { path?: string }
  if (!filePath?.trim()) {
    return NextResponse.json({ error: 'path is required' }, { status: 400 })
  }

  const resolved = safeUserPath(filePath.trim())
  if (!resolved) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  const result = await runTool('open_file', { query: resolved })
  return NextResponse.json({
    ok: result.success,
    message: toolResultMessage(result),
    error: result.error,
  })
}
