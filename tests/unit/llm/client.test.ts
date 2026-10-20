import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { resetGroqEntityModelCacheForTests } from '@/lib/llm/groq-model'

const chatCompletionsCreate = vi.fn()

vi.mock('groq-sdk', () => ({
  default: class Groq {
    chat = {
      completions: {
        create: chatCompletionsCreate,
      },
    }
  },
}))

function mockGroqModelsFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/openai/v1/models')) {
        return new Response(
          JSON.stringify({
            data: [
              {
                id: 'openai/gpt-oss-20b',
                name: 'GPT OSS 20B',
                active: true,
                input_modalities: ['text'],
                supported_features: ['json_mode'],
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      }
      return new Response('not found', { status: 404 })
    })
  )
}

function groqContent(obj: unknown) {
  return {
    choices: [{ message: { content: JSON.stringify(obj) } }],
  }
}

describe('extractJSON', () => {
  beforeEach(() => {
    vi.resetModules()
    resetGroqEntityModelCacheForTests()
    chatCompletionsCreate.mockReset()
    process.env.GROQ_API_KEY = 'test-key'
    delete process.env.GROQ_MODEL
    mockGroqModelsFetch()
  })

  it('returns zod-validated JSON from chat completion', async () => {
    chatCompletionsCreate.mockResolvedValue(
      groqContent({
        entities: [
          { name: 'Dana Kim', kind: 'client', matches_existing_id: null, confidence: 0.9 },
        ],
      })
    )

    const schema = z.object({
      entities: z.array(
        z.object({
          name: z.string(),
          kind: z.string(),
          matches_existing_id: z.null(),
          confidence: z.number(),
        })
      ),
    })

    const { extractJSON } = await import('@/lib/llm/client')
    const result = await extractJSON('sys', 'user', schema)
    expect(result.entities[0]?.name).toBe('Dana Kim')
    expect(chatCompletionsCreate).toHaveBeenCalledOnce()
    expect(chatCompletionsCreate.mock.calls[0]?.[0]).toMatchObject({
      model: 'openai/gpt-oss-20b',
      response_format: { type: 'json_object' },
      temperature: 0,
    })
  })

  it('throws LlmExtractionError when validation fails after retry', async () => {
    const bad = {
      entities: [{ name: '', kind: 'client', matches_existing_id: null, confidence: 2 }],
    }
    chatCompletionsCreate.mockResolvedValue(groqContent(bad))

    const schema = z.object({
      entities: z.array(
        z.object({
          name: z.string().min(1),
          kind: z.string(),
          matches_existing_id: z.null(),
          confidence: z.number().max(1),
        })
      ),
    })

    const { extractJSON } = await import('@/lib/llm/client')
    const { LlmExtractionError } = await import('@/lib/llm/errors')
    await expect(extractJSON('sys', 'user', schema)).rejects.toBeInstanceOf(LlmExtractionError)
    expect(chatCompletionsCreate).toHaveBeenCalledTimes(2)
  })

  it('throws LlmExtractionError on non-JSON content', async () => {
    chatCompletionsCreate.mockResolvedValue({
      choices: [{ message: { content: 'not json at all' } }],
    })

    const schema = z.object({ entities: z.array(z.unknown()) })
    const { extractJSON } = await import('@/lib/llm/client')
    const { LlmExtractionError } = await import('@/lib/llm/errors')
    await expect(extractJSON('sys', 'user', schema)).rejects.toSatisfy(
      (err: unknown) => err instanceof LlmExtractionError && err.code === 'parse'
    )
  })
})

describe('llmCacheKey', () => {
  it('is stable for the same prompts', async () => {
    const { llmCacheKey } = await import('@/lib/llm/client')
    expect(llmCacheKey('a', 'b')).toBe(llmCacheKey('a', 'b'))
    expect(llmCacheKey('a', 'b')).not.toBe(llmCacheKey('a', 'c'))
  })
})
