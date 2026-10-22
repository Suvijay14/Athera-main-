'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

type Point = { x: number; y: number }

function measureCenter(container: HTMLElement, target: HTMLElement): Point {
  const cr = container.getBoundingClientRect()
  const tr = target.getBoundingClientRect()
  return {
    x: tr.left - cr.left + tr.width / 2,
    y: tr.top - cr.top + tr.height / 2,
  }
}

function PointerCursorSvg() {
  return (
    <svg width="14" height="22" viewBox="0 0 14 22" className="block overflow-visible" aria-hidden>
      <path
        d="M0 0 L0 16.5 L3.4 12.4 L6.6 20.6 L8.9 19.4 L5.9 11.2 L10.2 11.2 Z"
        fill="#b85d3f"
        stroke="white"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function DemoPointer({
  active,
  containerRef,
  targetRef,
  from,
  onClickComplete,
}: {
  active: boolean
  containerRef: React.RefObject<HTMLElement | null>
  targetRef: React.RefObject<HTMLElement | null>
  from?: Point
  onClickComplete?: () => void
}) {
  const [route, setRoute] = useState<{ from: Point; to: Point } | null>(null)
  const [phase, setPhase] = useState<'glide' | 'click'>('glide')

  const remeasure = useCallback(() => {
    const container = containerRef.current
    const target = targetRef.current
    if (!container || !target) return
    const cr = container.getBoundingClientRect()
    const to = measureCenter(container, target)
    const fromPt = from ?? { x: cr.width * 0.75, y: cr.height * 0.35 }
    setRoute({ from: fromPt, to })
  }, [containerRef, targetRef, from])

  useLayoutEffect(() => {
    if (!active) {
      setRoute(null)
      setPhase('glide')
      return
    }
    remeasure()
    const f = requestAnimationFrame(remeasure)
    return () => cancelAnimationFrame(f)
  }, [active, remeasure])

  useEffect(() => {
    if (!active || !route) return
    setPhase('glide')
    const clickT = window.setTimeout(() => setPhase('click'), 650)
    const doneT = window.setTimeout(() => onClickComplete?.(), 870)
    return () => {
      window.clearTimeout(clickT)
      window.clearTimeout(doneT)
    }
  }, [active, route, onClickComplete])

  if (!active || !route) return null

  return (
    <motion.div
      className="absolute left-0 top-0 z-40 pointer-events-none"
      initial={{ x: route.from.x, y: route.from.y, opacity: 0 }}
      animate={{ x: route.to.x, y: route.to.y, opacity: 1 }}
      transition={{ duration: 0.65, ease: 'easeOut' }}
      aria-hidden
    >
      <motion.div
        className="relative origin-top-left"
        animate={phase === 'click' ? { scale: [1, 0.85, 1] } : { scale: 1 }}
        transition={{ duration: 0.22 }}
      >
        {phase === 'click' ? (
          <motion.span
            className="absolute left-0 top-0 rounded-full border-2 border-terracotta/55 pointer-events-none"
            initial={{ width: 6, height: 6, opacity: 0.8, x: -3, y: -3 }}
            animate={{ width: 28, height: 28, opacity: 0, x: -14, y: -14 }}
            transition={{ duration: 0.34, ease: 'easeOut' }}
          />
        ) : null}
        <PointerCursorSvg />
      </motion.div>
      <span className="absolute text-[10px] px-2 py-0.5 rounded whitespace-nowrap bg-terracotta text-white font-semibold left-[14px] top-[20px]">
        Athera
      </span>
    </motion.div>
  )
}
