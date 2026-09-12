'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import clsx from 'clsx'
import {
  checkAgentHealth,
  checkKokoroHealth,
  fetchPermissions,
  isLlmReady,
  llmStatusLabel,
  sendVoiceCommand,
  speakWithKokoro,
  stopKokoroSpeech,
  type AgentHealth,
  type ChatMessage,
  type KokoroHealth,
  type PermissionStatus,
} from '@/lib/agent'
import Link from 'next/link'
import { usePendingFiles } from '@/components/PendingFilesContext'
import { submitCommandFeedback } from '@/lib/commands'
import type { FileListItem, PendingEmailFiling, PendingLifeAction, PendingToolContext } from '@/lib/types'

type FeedbackMode = 'buttons' | 'error-input' | 'logged-confirmed' | 'logged-broken' | null

type AssistantState = 'checking' | 'offline' | 'ready' | 'listening' | 'processing' | 'speaking'

interface SpeechRecognitionEventLike {
  results: { [index: number]: { [index: number]: { transcript: string } } }
}

interface SpeechRecognitionLike {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
}

interface VoiceContextValue {
  open: boolean
  setOpen: (v: boolean) => void
  state: AssistantState
  startListening: () => void
}

const VoiceContext = createContext<VoiceContextValue | null>(null)

export function VoiceSidebarButton() {
  const ctx = useContext(VoiceContext)
  if (!ctx) return null

  return (
    <button
      type="button"
      onClick={() => {
        ctx.setOpen(true)
        if (ctx.state === 'ready') ctx.startListening()
      }}
      className="mx-3 mb-3 flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-terracotta text-white text-sm font-medium hover:bg-terracotta-soft transition-colors w-[calc(100%-1.5rem)]"
    >
      <span className="text-lg">🎙</span>
      Voice
    </button>
  )
}

export function VoiceAssistantProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<AssistantState>('checking')
  const [health, setHealth] = useState<AgentHealth | null>(null)
  const [kokoro, setKokoro] = useState<KokoroHealth | null>(null)
  const [ttsEngine, setTtsEngine] = useState<'kokoro' | 'browser'>('kokoro')
  const [permissions, setPermissions] = useState<PermissionStatus[]>([])
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  const [history, setHistory] = useState<ChatMessage[]>([])
  const [error, setError] = useState('')
  const [textInput, setTextInput] = useState('')
  const [lastTool, setLastTool] = useState('unknown')
  const [feedbackMode, setFeedbackMode] = useState<FeedbackMode>(null)
  const [errorInput, setErrorInput] = useState('')
  const [pendingLife, setPendingLife] = useState<PendingLifeAction | null>(null)
  const [pendingEmail, setPendingEmail] = useState<PendingEmailFiling | null>(null)
  const [pendingTool, setPendingTool] = useState<PendingToolContext | null>(null)
  const [fileList, setFileList] = useState<FileListItem[]>([])
  const pendingLifeRef = useRef<PendingLifeAction | null>(null)
  const pendingEmailRef = useRef<PendingEmailFiling | null>(null)
  const pendingToolRef = useRef<PendingToolContext | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const pendingTranscript = useRef('')
  const skipSpeakRef = useRef(false)
  const speakGenerationRef = useRef(0)
  const speakPollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { setPending } = usePendingFiles()

  const stopSpeaking = useCallback(async () => {
    skipSpeakRef.current = true
    speakGenerationRef.current += 1
    if (speakPollRef.current) {
      clearInterval(speakPollRef.current)
      speakPollRef.current = null
    }
    recognitionRef.current?.stop()
    await stopKokoroSpeech()
    setState(isLlmReady(health) ? 'ready' : 'offline')
  }, [health])

  const refreshStatus = useCallback(async (showChecking = false) => {
    if (showChecking) {
      setState((prev) =>
        ['speaking', 'processing', 'listening'].includes(prev) ? prev : 'checking'
      )
    }
    const [h, k, p] = await Promise.all([
      checkAgentHealth(),
      checkKokoroHealth(),
      fetchPermissions(),
    ])
    setHealth(h)
    setKokoro(k)
    setPermissions(p)
    setState((prev) => {
      if (['speaking', 'processing', 'listening'].includes(prev)) return prev
      return isLlmReady(h) ? 'ready' : 'offline'
    })
  }, [])

  useEffect(() => {
    refreshStatus(true)
    const interval = setInterval(() => refreshStatus(false), 15000)
    return () => clearInterval(interval)
  }, [refreshStatus])

  const speak = useCallback(async (text: string) => {
    if (skipSpeakRef.current) return

    const gen = ++speakGenerationRef.current
    setState('speaking')
    const result = await speakWithKokoro(text, kokoro?.voice)

    if (skipSpeakRef.current || gen !== speakGenerationRef.current) return

    setTtsEngine(result.engine)

    if (result.engine === 'kokoro' && result.durationMs) {
      await new Promise<void>((resolve) => {
        const t = setTimeout(() => {
          if (speakPollRef.current) clearInterval(speakPollRef.current)
          speakPollRef.current = null
          resolve()
        }, result.durationMs)
        speakPollRef.current = setInterval(() => {
          if (skipSpeakRef.current || gen !== speakGenerationRef.current) {
            clearTimeout(t)
            if (speakPollRef.current) clearInterval(speakPollRef.current)
            speakPollRef.current = null
            resolve()
          }
        }, 100)
      })
    } else if (result.engine === 'browser' && 'speechSynthesis' in window) {
      await new Promise<void>((resolve) => {
        speakPollRef.current = setInterval(() => {
          if (skipSpeakRef.current || gen !== speakGenerationRef.current) {
            if (speakPollRef.current) clearInterval(speakPollRef.current)
            speakPollRef.current = null
            resolve()
            return
          }
          if (!window.speechSynthesis.speaking) {
            if (speakPollRef.current) clearInterval(speakPollRef.current)
            speakPollRef.current = null
            resolve()
          }
        }, 200)
      })
    }

    if (!skipSpeakRef.current && gen === speakGenerationRef.current) {
      setState('ready')
    }
  }, [kokoro?.voice])

  const processCommand = useCallback(
    async (text: string) => {
      if (!text.trim()) return
      skipSpeakRef.current = false
      setTranscript(text)
      setState('processing')
      setError('')
      setFeedbackMode(null)

      const result = await sendVoiceCommand(
        text,
        history,
        pendingLifeRef.current,
        pendingEmailRef.current,
        pendingToolRef.current
      )
      if (!result) {
        setError('Voice not ready. Start Ollama or configure Groq in .env.local.')
        setState('offline')
        return
      }

      setResponse(result.response)
      setFileList(result.fileList ?? [])
      setLastTool(result.toolsUsed?.[0] ?? 'unknown')
      setFeedbackMode('buttons')
      if (result.pendingApproval) setPending(result.pendingApproval)

      if (result.toolsUsed?.includes('email_filing')) {
        pendingEmailRef.current = null
        setPendingEmail(null)
      } else if (result.toolsUsed?.includes('life_action')) {
        pendingLifeRef.current = null
        setPendingLife(null)
      }

      if (
        !result.toolsUsed?.includes('email_filing') &&
        !result.toolsUsed?.includes('life_action')
      ) {
        const nextEmail = result.pendingEmailFiling ?? null
        pendingEmailRef.current = nextEmail
        setPendingEmail(nextEmail)

        const nextLife = result.pendingLifeAction ?? null
        pendingLifeRef.current = nextLife
        setPendingLife(nextLife)

        const nextTool =
          result.pendingToolContext !== undefined
            ? result.pendingToolContext
            : pendingToolRef.current
        pendingToolRef.current = nextTool
        setPendingTool(nextTool)
      }
      setHistory((prev) => [
        ...prev.slice(-8),
        { role: 'user', content: text },
        { role: 'assistant', content: result.response },
      ])
      if (!skipSpeakRef.current) {
        await speak(result.response)
      } else {
        setState(isLlmReady(health) ? 'ready' : 'offline')
      }
    },
    [history, speak, setPending, health]
  )

  const startListening = useCallback(() => {
    setError('')
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('Speech recognition not supported. Use Chrome.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognitionRef.current = recognition
    pendingTranscript.current = ''

    recognition.onresult = (event) => {
      let text = ''
      for (let i = 0; i < Object.keys(event.results).length; i++) {
        text += event.results[i][0].transcript
      }
      pendingTranscript.current = text
      setTranscript(text)
    }

    recognition.onerror = () => setState(isLlmReady(health) ? 'ready' : 'offline')

    recognition.onend = () => {
      const text = pendingTranscript.current.trim()
      if (text) processCommand(text)
      else setState(isLlmReady(health) ? 'ready' : 'offline')
    }

    try {
      recognition.start()
      setState('listening')
    } catch {
      setError('Could not start microphone. Check browser permissions.')
      setState('ready')
    }
  }, [health, processCommand])

  const handleMicClick = () => {
    if (state === 'listening') {
      recognitionRef.current?.stop()
      return
    }
    if (state === 'offline' || !isLlmReady(health)) return
    startListening()
  }

  const isListening = state === 'listening'
  const isLoading = state === 'processing' || state === 'speaking'
  const canStop = isLoading || isListening

  const openFileItem = useCallback(async (item: FileListItem) => {
    try {
      const res = await fetch('/api/files/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: item.path }),
      })
      const data = (await res.json()) as { message?: string; error?: string }
      setResponse(data.message ?? data.error ?? `Opened ${item.name}.`)
    } catch {
      setResponse(`Could not open ${item.name}.`)
    }
  }, [])

  const submitFeedback = useCallback(
    async (status: 'confirmed' | 'broken', error?: string) => {
      if (!transcript || !response) return
      await submitCommandFeedback({
        phrase: transcript,
        response,
        tool: lastTool,
        status,
        error,
      })
      setFeedbackMode(status === 'confirmed' ? 'logged-confirmed' : 'logged-broken')
      setErrorInput('')
      window.setTimeout(() => setFeedbackMode(null), 2000)
    },
    [transcript, response, lastTool]
  )

  const handleTextSubmit = useCallback(() => {
    const text = textInput.trim()
    if (!text || isListening || isLoading || !isLlmReady(health)) return
    setTextInput('')
    processCommand(text)
  }, [textInput, isListening, isLoading, health, processCommand])

  const stateLabel: Record<AssistantState, string> = {
    checking: 'Checking…',
    offline: 'Setup required',
    ready: 'Tap to speak',
    listening: 'Listening…',
    processing: 'Thinking…',
    speaking: 'Speaking…',
  }

  return (
    <VoiceContext.Provider value={{ open, setOpen, state, startListening }}>
      {children}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] card shadow-modal border border-border-delicate overflow-hidden">
          <div className="bg-surface-vellum px-4 py-3 border-b border-border-delicate flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-ink-primary font-newsreader">Athena Voice</div>
              <div className="text-[10px] text-ink-faint">
                {kokoro?.running
                  ? `Kokoro · ${kokoro.voice}`
                  : 'Kokoro offline · browser TTS fallback'}{' '}
                · {llmStatusLabel(health)} · no Dex
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={stopSpeaking}
                disabled={!canStop}
                title="Stop speaking"
                className={clsx(
                  'flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide transition-colors',
                  canStop
                    ? 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200'
                    : 'bg-surface-container text-ink-faint border border-border-delicate cursor-not-allowed opacity-50'
                )}
              >
                ■ Stop
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-ink-faint hover:text-ink-primary text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div
                  className={clsx(
                    'w-2 h-2 rounded-full',
                    isLlmReady(health) ? 'bg-sage animate-pulse' : 'bg-red-500'
                  )}
                />
                <span className="text-ink-muted">{llmStatusLabel(health)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={clsx(
                    'w-2 h-2 rounded-full',
                    kokoro?.running ? 'bg-sage' : 'bg-ochre'
                  )}
                />
                <span className="text-ink-muted">
                  {kokoro?.running
                    ? `Kokoro · ${kokoro.voice}${ttsEngine === 'kokoro' ? ' (speaking)' : ''}`
                    : 'Kokoro offline — start from Setup'}
                </span>
              </div>
            </div>

            {(state === 'offline' || !isLlmReady(health)) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
                <p className="text-xs text-red-800">
                  Start Ollama locally, or add GROQ_API_KEY to .env.local for cloud fallback.
                  Allow mic permissions in the browser.
                </p>
                <Link href="/setup" className="block text-center btn-primary text-sm py-2.5">
                  Open Setup →
                </Link>
              </div>
            )}

            {permissions.length > 0 && (
              <div className="space-y-1.5">
                <div className="label-caps">Permissions</div>
                {permissions.map((p) => (
                  <div key={p.id} className="flex items-start justify-between gap-2 text-xs">
                    <span className="text-ink-secondary">{p.label}</span>
                    <span
                      className={clsx(
                        'font-medium flex-shrink-0',
                        p.granted === true && 'text-sage',
                        p.granted === false && 'text-red-600',
                        p.granted === 'unknown' && 'text-ink-faint'
                      )}
                    >
                      {p.granted === true ? '✓' : p.granted === false ? 'Needed' : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col items-center py-2">
              <button
                type="button"
                onClick={handleMicClick}
                disabled={state === 'processing' || state === 'speaking'}
                className={clsx(
                  'w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all',
                  state === 'listening'
                    ? 'bg-red-500 text-white scale-110 animate-pulse'
                    : 'bg-terracotta text-white hover:bg-terracotta-soft',
                  (state === 'processing' || state === 'speaking') && 'opacity-50 cursor-not-allowed'
                )}
              >
                🎙
              </button>
              <span className="text-xs text-ink-faint mt-2">{stateLabel[state]}</span>
              <input
                type="text"
                placeholder="Or type a message..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleTextSubmit()
                  }
                }}
                disabled={isListening || isLoading || !isLlmReady(health)}
                className={clsx(
                  'mt-3 w-full px-3 py-2 text-sm rounded-lg border border-border-delicate',
                  'bg-surface-paper text-ink-primary placeholder:text-ink-faint',
                  'focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              />
            </div>

            {transcript && (
              <div className="text-xs">
                <span className="label-caps">You</span>
                <p className="text-ink-primary mt-1">{transcript}</p>
              </div>
            )}
            {response && (
              <div className="text-xs">
                <span className="label-caps text-terracotta">Athena</span>
                <p className="text-ink-secondary mt-1 font-newsreader whitespace-pre-wrap">
                  {response}
                </p>
                {fileList.length > 0 && (
                  <ul className="mt-2 space-y-1 max-h-[160px] overflow-y-auto">
                    {fileList.slice(0, 10).map((item, i) => (
                      <li key={item.path}>
                        <button
                          type="button"
                          onClick={() => openFileItem(item)}
                          className="w-full text-left px-2 py-1.5 rounded-md border border-border-delicate bg-surface-vellum hover:bg-ochre-light/40 transition-colors flex items-center gap-2"
                        >
                          <span className="text-ink-faint w-4 flex-shrink-0">{i + 1}.</span>
                          <span className="flex-shrink-0">{item.kind === 'directory' ? '📁' : '📄'}</span>
                          <span className="truncate text-ink-primary">{item.name}</span>
                        </button>
                      </li>
                    ))}
                    {fileList.length > 10 && (
                      <li className="text-[10px] text-ink-faint px-2">+{fileList.length - 10} more</li>
                    )}
                  </ul>
                )}
                {feedbackMode === 'buttons' && (
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => submitFeedback('confirmed')}
                      className="text-[10px] px-2.5 py-1 rounded-md font-medium bg-sage-light text-sage hover:bg-sage/20 transition-colors"
                    >
                      ✓ Confirmed
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeedbackMode('error-input')}
                      className="text-[10px] px-2.5 py-1 rounded-md font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                    >
                      ✗ Broken
                    </button>
                  </div>
                )}
                {feedbackMode === 'error-input' && (
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="What went wrong?"
                      value={errorInput}
                      autoFocus
                      onChange={(e) => setErrorInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && errorInput.trim()) {
                          e.preventDefault()
                          submitFeedback('broken', errorInput.trim())
                        }
                      }}
                      className="w-full px-2.5 py-1.5 text-xs rounded-md border border-red-200 bg-red-50/50 focus:outline-none focus:ring-1 focus:ring-red-300"
                    />
                  </div>
                )}
                {feedbackMode === 'logged-confirmed' && (
                  <p className="text-[10px] text-sage mt-2 transition-opacity">✓ Logged</p>
                )}
                {feedbackMode === 'logged-broken' && (
                  <p className="text-[10px] text-red-600 mt-2 transition-opacity">✗ Logged</p>
                )}
              </div>
            )}
            {pendingEmail && (
              <div className="bg-ochre-light border border-ochre/30 rounded-lg p-3 text-xs space-y-2">
                <div className="font-semibold text-ochre uppercase tracking-wide text-[10px]">
                  Email filing — waiting for approval
                </div>
                <p className="text-ink-secondary">{pendingEmail.userMessage}</p>
                <div className="max-h-[120px] overflow-y-auto space-y-1">
                  {pendingEmail.suggestions.slice(0, 5).map((s) => (
                    <div key={s.messageId} className="text-[10px] text-ink-muted truncate">
                      📧 {s.subject} → {s.spaceName}
                    </div>
                  ))}
                  {pendingEmail.suggestions.length > 5 && (
                    <div className="text-[10px] text-ink-faint">
                      +{pendingEmail.suggestions.length - 5} more
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => processCommand('yes')}
                    disabled={isLoading}
                    className="btn-primary text-[10px] py-1.5 px-3"
                  >
                    Add all
                  </button>
                  <button
                    type="button"
                    onClick={() => processCommand('no')}
                    disabled={isLoading}
                    className="btn-secondary text-[10px] py-1.5 px-3"
                  >
                    Skip
                  </button>
                </div>
              </div>
            )}
            {pendingTool && (
              <div className="bg-surface-vellum border border-border-delicate rounded-lg p-3 text-xs">
                <div className="font-semibold text-ink-muted uppercase tracking-wide text-[10px]">
                  Follow-up context — {pendingTool.items.length} results
                </div>
                <p className="text-ink-secondary mt-1">{pendingTool.userMessage}</p>
                <p className="text-ink-faint mt-1">
                  Try &ldquo;list them&rdquo;, &ldquo;open the first one&rdquo;, or a number
                </p>
              </div>
            )}
            {pendingLife && (
              <div className="bg-ochre-light border border-ochre/30 rounded-lg p-3 text-xs">
                <div className="font-semibold text-ochre uppercase tracking-wide text-[10px]">
                  Waiting for yes / no
                </div>
                <p className="text-ink-secondary mt-1">{pendingLife.signal}</p>
                <p className="text-ink-faint mt-1">
                  Say or type &ldquo;yes&rdquo; or &ldquo;no&rdquo;
                </p>
              </div>
            )}
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
        </div>
      )}
    </VoiceContext.Provider>
  )
}
