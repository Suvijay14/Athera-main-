'use client'

import { useState, useRef } from 'react'
import { streamCommand, sendCommand } from '@/lib/api'

interface ThinkOutLoudProps {
  space: string
  onResponse?: (text: string) => void
}

export default function ThinkOutLoud({ space, onResponse }: ThinkOutLoudProps) {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamedText, setStreamedText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(text: string = input) {
    if (!text.trim() || isLoading) return

    setIsLoading(true)
    setStreamedText('')
    const query = text.trim()
    setInput('')

    try {
      let full = ''
      let gotChunk = false

      for await (const chunk of streamCommand(query, space)) {
        full += chunk
        gotChunk = true
        setStreamedText(full)
      }

      if (!gotChunk) {
        const result = await sendCommand(query, space)
        setStreamedText(result.response)
        full = result.response
      }

      onResponse?.(full)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${isLoading ? 'bg-terracotta animate-pulse' : 'bg-terracotta'}`}
          />
          <span className="label-caps">Think Out Loud</span>
        </div>
        <span className="text-xs text-ink-faint">Athera AI Assistant</span>
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
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="What's on your mind? Ask anything..."
          className="flex-1 bg-transparent text-sm text-ink-primary placeholder-ink-faint outline-none"
          disabled={isLoading}
        />
        <button
          onClick={() => handleSubmit()}
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
