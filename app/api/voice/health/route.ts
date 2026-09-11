import { NextResponse } from 'next/server'
import { getActiveLLMInfo } from '@/lib/server/llm'
import { getOllamaSetupStatus } from '@/lib/server/ollama-setup'

export async function GET() {
  const llm = await getActiveLLMInfo()
  const ollamaSetup = await getOllamaSetupStatus()

  return NextResponse.json({
    status: 'ok',
    ollama: llm.ollama,
    ollamaInstalled: ollamaSetup.installed,
    ollamaPath: ollamaSetup.path,
    groq: llm.groq,
    provider: llm.provider,
    llmReady: llm.llmReady,
    model: llm.model,
    installedModels: ollamaSetup.models,
    suggestedModel: ollamaSetup.suggestedModel,
    platform: process.platform,
    integrated: true,
  })
}
