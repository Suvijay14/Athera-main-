import 'server-only'

import Groq from 'groq-sdk'
import { createHash } from 'node:crypto'
import type { ZodSchema } from 'zod'

import { LlmExtractionError } from '@/lib/llm/errors'
import { resolveGroqEntityModel } from '@/lib/llm/groq-model'

const JSON_SYSTEM_SUFFIX =
  '\n\nYou must respond with a single JSON object only. No markdown, no code fences, no commentary.'

/** Upper bound so command-bar / extraction callers do not hang forever on Groq. */
const GROQ_CHAT_TIMEOUT_MS = 45_000

let clientSingleton: Groq | null = null

function getApiKey(): string {
  const key = process.env.GROQ_API_KEY?.trim()
  if (!key) {
    throw new LlmExtractionError('api', 'GROQ_API_KEY is not configured')
  }
  return key
}

function getClient(): Groq {
  const key = getApiKey()
  if (!clientSingleton) {
    clientSingleton = new Groq({ apiKey: key })
  }
  return clientSingleton
}

export function llmCacheKey(systemPrompt: string, userPrompt: string): string {
  const h = createHash('sha256')
  h.update(systemPrompt)
  h.update('\0')
  h.update(userPrompt)
  return h.digest('hex')
}

function parseJsonContent(content: string): unknown {
  const trimmed = content.trim()
  const fenceMatch = /^```(?:json)?\s*([\s\S]*?)```$/i.exec(trimmed)
  const jsonText = fenceMatch ? fenceMatch[1]!.trim() : trimmed
  try {
    return JSON.parse(jsonText) as unknown
  } catch (err) {
    throw new LlmExtractionError('parse', 'Model returned non-JSON content', err)
  }
}

async function requestJsonObject(
  client: Groq,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  extraUserTurn?: string
): Promise<unknown> {
  const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt + JSON_SYSTEM_SUFFIX },
    { role: 'user', content: userPrompt },
  ]
  if (extraUserTurn) {
    messages.push({ role: 'user', content: extraUserTurn })
  }

  let response
  try {
    response = await client.chat.completions.create(
      {
        model,
        temperature: 0,
        max_tokens: 1024,
        response_format: { type: 'json_object' },
        messages,
      },
      { signal: AbortSignal.timeout(GROQ_CHAT_TIMEOUT_MS) }
    )
  } catch (err) {
    throw new LlmExtractionError('api', 'Groq API call failed', err)
  }

  const content = response.choices[0]?.message?.content
  if (!content?.trim()) {
    throw new LlmExtractionError('parse', 'Model returned empty content')
  }
  return parseJsonContent(content)
}

export async function extractJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  schema: ZodSchema<T>,
  _toolName = 'structured_output'
): Promise<T> {
  void _toolName
  const client = getClient()
  const model = await resolveGroqEntityModel(getApiKey())

  let raw = await requestJsonObject(client, model, systemPrompt, userPrompt)
  let parsed = schema.safeParse(raw)
  if (parsed.success) {
    return parsed.data
  }

  const retryHint = `Your previous JSON failed validation: ${parsed.error.message}. Reply with corrected JSON only.`
  raw = await requestJsonObject(client, model, systemPrompt, userPrompt, retryHint)
  parsed = schema.safeParse(raw)
  if (!parsed.success) {
    throw new LlmExtractionError('validation', parsed.error.message)
  }
  return parsed.data
}
