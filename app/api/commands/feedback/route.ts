import { NextRequest, NextResponse } from 'next/server'
import {
  applyFeedback,
  readCommandsFile,
  writeCommandsFile,
  type CommandFeedback,
} from '@/lib/server/commands-md'

export async function GET() {
  const data = readCommandsFile()
  return NextResponse.json({
    confirmed: data.confirmed.map((r) => ({
      command: r.command,
      phrase: r.phrase,
      tool: r.tool,
      notes: r.notes,
    })),
    broken: data.broken.map((r) => ({
      command: r.command,
      phrase: r.phrase,
      error: r.error,
      fix: r.fixNeeded,
    })),
    untested: data.untested.map((r) => ({
      command: r.command,
      phrase: r.phrase,
      tool: r.tool,
    })),
    lastUpdated: data.lastUpdated,
  })
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<CommandFeedback>

  if (!body.phrase?.trim() || !body.response?.trim() || !body.status) {
    return NextResponse.json(
      { error: 'phrase, response, and status are required' },
      { status: 400 }
    )
  }

  if (body.status !== 'confirmed' && body.status !== 'broken') {
    return NextResponse.json({ error: 'status must be confirmed or broken' }, { status: 400 })
  }

  if (body.status === 'broken' && !body.error?.trim()) {
    return NextResponse.json({ error: 'error is required when status is broken' }, { status: 400 })
  }

  const feedback: CommandFeedback = {
    phrase: body.phrase.trim(),
    response: body.response.trim(),
    tool: body.tool?.trim(),
    status: body.status,
    error: body.error?.trim(),
    timestamp: body.timestamp ?? new Date().toISOString(),
  }

  const current = readCommandsFile()
  const { data, command } = applyFeedback(current, feedback)
  writeCommandsFile(data)

  return NextResponse.json({ success: true, status: feedback.status, command })
}
