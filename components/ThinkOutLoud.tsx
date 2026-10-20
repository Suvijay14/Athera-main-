'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { checkAgentHealth, isLlmReady, llmStatusLabel, sendVoiceCommand } from '@/lib/agent'

interface ThinkOutLoudProps {
  space?: string
  onResponse?: (text: string) => void
}

export default function ThinkOutLoud({ onResponse }: ThinkOutLoudProps) {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamedText, setStreamedText] = useState('')
  const [llmLabel, setLlmLabel] = useState('Checking AI…')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    checkAgentHealth().then((health) => {
      setLlmLabel(isLlmReady(health) ? llmStatusLabel(health) : 'AI offline — /setup or Groq in .env')
    })
  }, [])

  const handleSubmit = useCallback(
    async (text: string = input) => {
      if (!text.trim() || isLoading) return

      setIsLoading(true)
      setStreamedText('')
      const query = text.trim()
      setInput('')

      try {
        let response = ''

        const wsRes = await fetch('/api/workspace/voice-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: query }),
        })
        if (wsRes.ok) {
          const wsData = (await wsRes.json()) as {
            handled?: boolean
            response?: string
            navigate?: string
          }
          if (wsData.handled && wsData.response) {
            response = wsData.response
            if (wsData.navigate && typeof window !== 'undefined') {
              window.location.assign(wsData.navigate)
            }
          }
        }

        if (!response) {
          const result = await sendVoiceCommand(query)
          response =
            result?.response ??
            'Voice assistant is offline. Start Ollama or set GROQ_API_KEY, then refresh.'
        }

        setStreamedText(response)
        onResponse?.(response)
      } finally {
        setIsLoading(false)
      }
    },
    [input, isLoading, onResponse]
  )

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${isLoading ? 'bg-terracotta animate-pulse' : 'bg-terracotta'}`}
          />
          <span className="label-caps">Think Out Loud</span>
        </div>
        <span className="text-xs text-ink-faint">{llmLabel}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-terracotta-light flex items-center justify-center flex-shrink-0">
          <span className="text-terracotta text-sm">🎙</span>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void handleSubmit()}
          placeholder="What's on your mind? Ask anything..."
          className="flex-1 bg-transparent text-sm text-ink-primary placeholder-ink-faint outline-none"
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!input.trim() || isLoading}
          className="btn-primary flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Thinking...' : 'Share thought →'}
        </button>
      </div>

      {streamedText && (
        <div className="mt-4 pt-4 border-t border-border-delicate">
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-full bg-terracotta-light flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-terracotta text-xs">✦</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="label-caps text-terracotta">Response</span>
              </div>
              <p className="text-sm text-ink-secondary font-newsreader italic leading-relaxed">
                &ldquo;{streamedText}
                {isLoading && <span className="animate-pulse">▌</span>}&rdquo;
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
