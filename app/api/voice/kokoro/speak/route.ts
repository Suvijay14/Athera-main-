import { NextRequest, NextResponse } from 'next/server'
import {
  kokoroSpeak,
  isKokoroRunning,
  estimateSpeechDuration,
  DEFAULT_KOKORO_VOICE,
} from '@/lib/server/kokoro'

export async function POST(req: NextRequest) {
  const { text, voice } = (await req.json()) as { text?: string; voice?: string }

  if (!text?.trim()) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 })
  }

  if (!(await isKokoroRunning())) {
    return NextResponse.json(
      { error: 'Kokoro is not running. Start it from /setup.' },
      { status: 503 }
    )
  }

  const ok = await kokoroSpeak(text.trim(), voice ?? DEFAULT_KOKORO_VOICE)
  if (!ok) {
    return NextResponse.json({ error: 'Kokoro speak failed' }, { status: 500 })
  }

  return NextResponse.json({
    status: 'ok',
    durationMs: Math.round(estimateSpeechDuration(text) * 1000),
    voice: voice ?? DEFAULT_KOKORO_VOICE,
  })
}
