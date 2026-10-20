import { describe, expect, it } from 'vitest'

import { pickGroqEntityModel } from '@/lib/llm/groq-model'

describe('pickGroqEntityModel', () => {
  const models = [
    { id: 'openai/gpt-oss-20b', name: null, jsonMode: true },
    { id: 'qwen/qwen3.8-27b', name: null, jsonMode: true },
  ]

  it('uses env model when listed', () => {
    expect(pickGroqEntityModel(models, 'qwen/qwen3.8-27b')).toBe('qwen/qwen3.8-27b')
  })

  it('falls back to preference order when env unset', () => {
    expect(pickGroqEntityModel(models, undefined)).toBe('openai/gpt-oss-20b')
  })

  it('falls back when env model is not on account', () => {
    expect(pickGroqEntityModel(models, 'llama-3.1-8b-instant')).toBe('openai/gpt-oss-20b')
  })
})
