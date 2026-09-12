import { NextRequest, NextResponse } from 'next/server'
import { runTool } from '@/lib/server/tools'

export async function GET() {
  const result = await runTool('get_clipboard', {})
  if (!result.success) {
    return NextResponse.json({ error: result.error ?? 'Failed to read clipboard' }, { status: 500 })
  }
  const data = result.data as { message?: string }
  const message = data.message ?? ''
  const content = message.replace(/^Clipboard contents:\n?/, '').trim()
  return NextResponse.json({ content, empty: !content || message.includes('empty') })
}

export async function POST(req: NextRequest) {
  const { text } = (await req.json()) as { text?: string }
  if (!text?.trim()) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 })
  }
  const result = await runTool('set_clipboard', { text: text.trim() })
  if (!result.success) {
    return NextResponse.json({ error: result.error ?? 'Failed to write clipboard' }, { status: 500 })
  }
  const data = result.data as { message?: string }
  return NextResponse.json({ ok: true, message: data.message ?? 'Copied.' })
}
