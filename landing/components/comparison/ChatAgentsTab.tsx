'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import {
  COMPARISON_TAB_DURATION_MS,
  COMPARISON_USER_WEEK_PROMPT,
  comparisonChatOrganizedList,
  comparisonChatQuietTag,
} from '@/lib/landing/comparison-demo'
import { getPersonaDemo, quietSectionRowsForPersona } from '@/demo-data'
import { useComparisonTimeline } from '@/components/landing/comparison/useComparisonTimeline'
import { useLandingPersona } from '@/components/landing/LandingPersonaContext'

const DURATION = COMPARISON_TAB_DURATION_MS.chat

function streamLength(full: string, elapsed: number, start: number, duration: number) {
  if (elapsed < start) return 0
  const p = Math.min(1, (elapsed - start) / duration)
  return Math.floor(full.length * p)
}

function WeeksLaterDivider({ visible }: { visible: boolean }) {
  if (!visible) return null
  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0.6 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="flex items-center gap-3 py-2"
    >
      <span className="h-px flex-1 bg-border-delicate" />
      <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-muted whitespace-nowrap">
        3 weeks later
      </span>
      <span className="h-px flex-1 bg-border-delicate" />
    </motion.div>
  )
}

export default function ChatAgentsTab({
  paused,
  reducedMotion,
  onComplete,
}: {
  paused: boolean
  reducedMotion: boolean
  onComplete: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { persona } = useLandingPersona()
  const [elapsed, setElapsed] = useState(reducedMotion ? DURATION : 0)

  const onTick = useCallback((e: number) => setElapsed(e), [])
  useComparisonTimeline(`chat-${persona}`, DURATION, !reducedMotion, paused, onTick, onComplete)

  const organized = useMemo(() => comparisonChatOrganizedList(persona), [persona])
  const quietName = getPersonaDemo(persona).quietEntity.name
  const quietTag = comparisonChatQuietTag(persona)
  const sidebarRows = useMemo(() => quietSectionRowsForPersona(persona).slice(0, 4), [persona])

  const t = reducedMotion ? DURATION : elapsed
  const showUser = t >= 350
  const listLen = streamLength(organized, t, 1100, 2200)
  const showLater = t >= 3800
  const laterPhase = t >= 4200

  const listText = organized.slice(0, listLen)

  return (
    <div ref={containerRef} className="relative min-h-[340px] pointer-events-none select-none">
      <div className="flex gap-3 min-h-[300px]">
        <div className="flex-1 landing-card overflow-hidden flex flex-col min-h-[280px]">
          <div className="px-3 py-2 border-b border-border-delicate bg-surface-container text-[11px] font-medium text-ink-muted">
            AI chatbots
          </div>
          <div className="p-3 sm:p-4 space-y-3 flex-1 overflow-hidden">
            {showUser ? (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
                <p className="rounded-2xl rounded-br-sm bg-[#e8e4dc] text-ink-secondary px-3 py-2 max-w-[92%] text-xs sm:text-sm leading-relaxed">
                  {COMPARISON_USER_WEEK_PROMPT}
                </p>
              </motion.div>
            ) : null}

            {listLen > 0 && !laterPhase ? (
              <div className="flex justify-start">
                <p className="rounded-2xl rounded-bl-sm bg-surface-container text-ink-primary px-3 py-2 max-w-[95%] text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                  {listText}
                  {!reducedMotion && listLen < organized.length ? (
                    <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-ink-muted/40 animate-pulse align-middle" />
                  ) : null}
                </p>
              </div>
            ) : null}

            <WeeksLaterDivider visible={showLater} />

            {laterPhase ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-ink-faint text-center py-4 italic"
              >
                No new messages
              </motion.p>
            ) : null}
          </div>
        </div>

        <aside className="w-[108px] sm:w-[120px] shrink-0 landing-card p-2 flex flex-col">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-ink-muted mb-2">Clients</p>
          <div className="space-y-1.5 flex-1">
            {sidebarRows.map((row) => {
              const isQuiet = row.name === quietName || row.isQuiet
              const dim = laterPhase && isQuiet
              return (
                <div
                  key={row.id}
                  className={clsx(
                    'rounded-md px-1.5 py-1 border border-border-delicate/80 transition-opacity duration-500',
                    dim ? 'opacity-30' : 'opacity-100'
                  )}
                >
                  <p className="text-[10px] font-medium text-ink-primary truncate">{row.name}</p>
                  {dim ? (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[8px] text-ink-muted leading-tight block mt-0.5"
                    >
                      {quietTag}
                    </motion.span>
                  ) : row.nextDay ? (
                    <span className="text-[8px] text-ink-faint">Next {row.nextDay}</span>
                  ) : null}
                </div>
              )
            })}
          </div>
        </aside>
      </div>
    </div>
  )
}
