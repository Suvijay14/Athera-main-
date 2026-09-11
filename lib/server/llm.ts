import { groqChat, groqGenerateJSON, getGroqModel, hasGroqKey } from './groq'
import {
  getModel as getOllamaModel,
  isOllamaRunning,
  ollamaChat,
  ollamaGenerateJSON,
} from './ollama'

export type LLMProvider = 'ollama' | 'groq'

/** Prefer local Ollama; fall back to Groq when Ollama is offline. */
export async function resolveLLMProvider(): Promise<LLMProvider | null> {
  if (await isOllamaRunning()) return 'ollama'
  if (hasGroqKey()) return 'groq'
  return null
}

export async function isLLMAvailable(): Promise<boolean> {
  return (await resolveLLMProvider()) !== null
}

export async function getActiveLLMInfo(): Promise<{
  provider: LLMProvider | null
  model: string
  llmReady: boolean
  ollama: boolean
  groq: boolean
}> {
  const ollama = await isOllamaRunning()
  const groq = hasGroqKey()
  const provider = ollama ? 'ollama' : groq ? 'groq' : null
  const model =
    provider === 'ollama'
      ? getOllamaModel()
      : provider === 'groq'
        ? getGroqModel()
        : getOllamaModel()

  return {
    provider,
    model,
    llmReady: provider !== null,
    ollama,
    groq,
  }
}

export async function llmChat(
  messages: Array<{ role: string; content: string }>,
  options?: { temperature?: number; numPredict?: number }
): Promise<string> {
  const provider = await resolveLLMProvider()
  if (provider === 'ollama') {
    return ollamaChat(messages, {
      temperature: options?.temperature,
      numPredict: options?.numPredict,
    })
  }
  if (provider === 'groq') {
    return groqChat(messages, {
      temperature: options?.temperature,
      maxTokens: options?.numPredict,
    })
  }
  throw new Error('No AI available. Start Ollama or configure GROQ_API_KEY in .env.local.')
}

export async function llmGenerateJSON(system: string, prompt: string): Promise<string> {
  const provider = await resolveLLMProvider()
  if (provider === 'ollama') return ollamaGenerateJSON(system, prompt)
  if (provider === 'groq') return groqGenerateJSON(system, prompt)
  throw new Error('No AI available. Start Ollama or configure GROQ_API_KEY in .env.local.')
}
