'use client'

import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

/** Subtle 32px grid flash inside a demo frame after reshape (2.5s total). */
export default function DemoReshapeGridFlash({ trigger }: { trigger: number }) {
  const reducedMotion = useReducedMotion()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (reducedMotion || trigger <= 0) return
    setVisible(true)
    const timer = window.setTimeout(() => setVisible(false), 2500)
    return () => window.clearTimeout(timer)
  }, [trigger, reducedMotion])

  if (!visible || reducedMotion) return null

  return <div className="demo-grid-flash" aria-hidden />
}
