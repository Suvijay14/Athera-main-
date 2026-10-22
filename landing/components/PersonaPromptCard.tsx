'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { LayoutGroup, motion } from 'framer-motion'
import clsx from 'clsx'
import { useLandingPersona } from '@/components/landing/LandingPersonaContext'
import type { LandingPersona } from '@/lib/landing/persona-content'

const CARD_OPTIONS: { id: LandingPersona; label: string }[] = [
  { id: 'freelancer', label: 'Freelance / studio' },
  { id: 'coach', label: 'Coach or tutor' },
  { id: 'founder', label: 'Building a startup' },
  { id: 'personal', label: 'Just me' },
]

const SEGMENTS: { id: LandingPersona; label: string }[] = [
  { id: 'freelancer', label: 'Freelance' },
  { id: 'coach', label: 'Coach' },
  { id: 'founder', label: 'Startup' },
  { id: 'personal', label: 'Personal' },
]

const BASE_BOTTOM_PX = 24
const BASE_RIGHT_PX = 24
const CONFLICT_PAD = 12
const LIFT_STEP_PX = 10
const MAX_LIFT_PX = 420

function useHeroFullyScrolledOut() {
  const [out, setOut] = useState(false)

  useEffect(() => {
    const el = document.getElementById('landing-hero-viewport')
    if (!el) return

    const check = () => {
      const rect = el.getBoundingClientRect()
      setOut(rect.bottom <= 0)
    }

    check()
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    return () => {
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [])

  return out
}

function useAppMeshSectionActive() {
  const [active, setActive] = useState(false)

  useEffect(() => {
    const el = document.getElementById('app-mesh-scroll')
    if (!el) return

    const check = () => {
      const rect = el.getBoundingClientRect()
      setActive(rect.top <= 0 && rect.bottom > 0)
    }

    check()
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    return () => {
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [])

  return active
}

function useSectionInView(elementId: string) {
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = document.getElementById(elementId)
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.12 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [elementId])

  return inView
}

function rectsOverlap(a: DOMRect, b: DOMRect, pad = 8) {
  return !(
    a.right + pad < b.left ||
    a.left - pad > b.right ||
    a.bottom + pad < b.top ||
    a.top - pad > b.bottom
  )
}

function shellRectForBottom(
  width: number,
  height: number,
  bottomPx: number,
  rightPx: number
): DOMRect {
  const left = Math.max(0, window.innerWidth - width - rightPx)
  const top = window.innerHeight - bottomPx - height
  return new DOMRect(left, top, width, height)
}

export default function PersonaPromptCard({
  pageRef: _pageRef,
}: {
  pageRef: React.RefObject<HTMLDivElement | null>
}) {
  const { persona, personaExplicit, setPersona } = useLandingPersona()
  const [persisted, setPersisted] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [liftPx, setLiftPx] = useState(0)
  const [conflictOccluded, setConflictOccluded] = useState(false)
  const shellRef = useRef<HTMLDivElement>(null)

  const heroFullyOut = useHeroFullyScrolledOut()
  const appMeshActive = useAppMeshSectionActive()
  const ctaInView = useSectionInView('early-access')

  const highlightPersona: LandingPersona | null = personaExplicit ? persona : null

  const measureConflict = useCallback(() => {
    const shell = shellRef.current
    if (!shell) return

    const zones = document.querySelectorAll('[data-persona-conflict-zone]')
    const zoneRects: DOMRect[] = []
    zones.forEach((node) => {
      const r = node.getBoundingClientRect()
      if (r.width > 0 && r.height > 0) zoneRects.push(r)
    })

    if (zoneRects.length === 0) {
      setLiftPx(0)
      setConflictOccluded(false)
      return
    }

    const measured = shell.getBoundingClientRect()
    const width = measured.width || 320
    const height = measured.height || 120

    const maxLift = Math.min(MAX_LIFT_PX, window.innerHeight * 0.55)

    for (let lift = 0; lift <= maxLift; lift += LIFT_STEP_PX) {
      const bottomPx = BASE_BOTTOM_PX + lift
      const candidate = shellRectForBottom(width, height, bottomPx, BASE_RIGHT_PX)
      const hit = zoneRects.some((z) => rectsOverlap(candidate, z, CONFLICT_PAD))
      if (!hit) {
        setLiftPx(lift)
        setConflictOccluded(false)
        return
      }
    }

    setConflictOccluded(true)
  }, [])

  useEffect(() => {
    measureConflict()
    window.addEventListener('scroll', measureConflict, { passive: true })
    window.addEventListener('resize', measureConflict)
    const id = window.setInterval(measureConflict, 350)
    return () => {
      window.removeEventListener('scroll', measureConflict)
      window.removeEventListener('resize', measureConflict)
      window.clearInterval(id)
    }
  }, [measureConflict, persisted, expanded, heroFullyOut])

  const collapseToPill = () => {
    setPersisted(true)
    setExpanded(false)
  }

  const onPickOption = (id: LandingPersona) => {
    setPersona(id)
    collapseToPill()
  }

  const onNotNow = () => {
    setPersona('freelancer', { track: false, explicit: false })
    collapseToPill()
  }

  const showInitialCard = !persisted
  const showExpandedCard = persisted && expanded
  const showPill = persisted && !expanded
  const mounted =
    heroFullyOut &&
    !appMeshActive &&
    (showInitialCard || showExpandedCard || showPill) &&
    !ctaInView

  if (!mounted) return null

  const isPill = showPill
  const shellStyle = {
    bottom: `calc(max(${BASE_BOTTOM_PX}px, env(safe-area-inset-bottom)) + ${liftPx}px)`,
    right: `max(${BASE_RIGHT_PX}px, env(safe-area-inset-right))`,
    visibility: conflictOccluded ? ('hidden' as const) : ('visible' as const),
    pointerEvents: conflictOccluded ? ('none' as const) : ('auto' as const),
  }

  return (
    <LayoutGroup id="persona-prompt">
      <motion.div
        ref={shellRef}
        layout
        layoutId="persona-prompt-shell"
        initial={showInitialCard ? { opacity: 0, y: 20, x: 12 } : false}
        animate={{
          opacity: conflictOccluded ? 0 : 1,
          y: 0,
          x: 0,
          scale: 1,
        }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        style={shellStyle}
        className={clsx(
          'fixed z-50',
          isPill
            ? 'w-auto max-w-[calc(100vw-48px)]'
            : 'w-full max-w-[min(360px,calc(100vw-48px))]'
        )}
        aria-hidden={conflictOccluded}
      >
        {isPill ? (
          <div
            className={clsx(
              'bg-surface-paper border border-border-delicate shadow-modal',
              'flex flex-row flex-wrap items-center gap-2 rounded-full px-3 py-2'
            )}
          >
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="shrink-0 text-terracotta font-medium text-sm hover:opacity-80 transition-opacity leading-none"
                aria-label="Expand examples picker"
              >
                ✦
              </button>
              <span className="text-sm text-ink-secondary whitespace-nowrap">Examples for:</span>
            </div>
            <div
              className="flex min-w-0 rounded-full border border-border-delicate overflow-hidden bg-surface-paper"
              role="tablist"
              aria-label="Example persona"
            >
              {SEGMENTS.map((seg) => {
                const active = highlightPersona === seg.id
                return (
                  <button
                    key={seg.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setPersona(seg.id)}
                    className={clsx(
                      'px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap',
                      active
                        ? 'bg-terracotta text-white'
                        : 'text-ink-primary hover:bg-terracotta-light/20'
                    )}
                  >
                    {seg.label}
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="bg-surface-paper border border-border-delicate border-l-4 border-l-terracotta shadow-modal rounded-lg px-4 py-4 sm:px-5 sm:py-5">
            <p className="text-sm sm:text-base font-medium text-ink-primary leading-snug">
              Want to see examples for you?
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {CARD_OPTIONS.map((opt) => {
                const selected = personaExplicit && persona === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onPickOption(opt.id)}
                    className={clsx(
                      'w-full text-left rounded-md border px-3 py-2.5 text-sm font-medium transition-colors',
                      selected
                        ? 'border-terracotta bg-terracotta-light/35 text-ink-primary'
                        : 'border-border-delicate bg-surface-paper text-ink-primary hover:border-terracotta/60 hover:bg-terracotta-light/25'
                    )}
                  >
                    {opt.label}
                  </button>
                )
              })}
              <button
                type="button"
                onClick={onNotNow}
                className="text-sm text-ink-muted hover:text-ink-primary py-1 transition-colors text-left"
              >
                Not now
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </LayoutGroup>
  )
}
