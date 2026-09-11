import { NextRequest, NextResponse } from 'next/server'
import { runVoiceCommand } from '@/lib/server/voice-orchestrator'
import { isLLMAvailable } from '@/lib/server/llm'
import type { PendingEmailFiling, PendingLifeAction } from '@/lib/types'

export async function POST(req: NextRequest) {
  const { text, history = [], pendingLifeAction = null, pendingEmailFiling = null } =
    (await req.json()) as {
      text?: string
      history?: Array<{ role: 'user' | 'assistant'; content: string }>
      pendingLifeAction?: PendingLifeAction | null
      pendingEmailFiling?: PendingEmailFiling | null
    }

  if (!text?.trim()) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 })
  }

  if (!(await isLLMAvailable())) {
    return NextResponse.json(
      {
        error:
          'No AI available. Start Ollama locally, or add GROQ_API_KEY to .env.local for cloud fallback.',
      },
      { status: 503 }
    )
  }

  try {
    const result = await runVoiceCommand(
      text.trim(),
      history,
      pendingLifeAction,
      pendingEmailFiling
    )
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Assistant failed' },
      { status: 500 }
    )
  }
}
