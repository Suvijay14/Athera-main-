'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

interface FadeInProps {
  children: ReactNode
  delay?: number
  duration?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale' | 'none'
  className?: string
  once?: boolean
  threshold?: number
}

const DIRECTION_INITIAL: Record<string, string> = {
  up: 'translate-y-3 opacity-0',
  down: '-translate-y-3 opacity-0',
  left: 'translate-x-3 opacity-0',
  right: '-translate-x-3 opacity-0',
  scale: 'scale-95 opacity-0',
  none: 'opacity-0',
}

export default function FadeIn({
  children,
  delay = 0,
  duration = 350,
  direction = 'up',
  className = '',
  once = true,
  threshold = 0.1,
}: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!hasAnimated || !once) {
            setTimeout(() => {
              setIsVisible(true)
              setHasAnimated(true)
            }, delay)
          }
        } else if (!once) {
          setIsVisible(false)
        }
      },
      { threshold }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [delay, once, threshold, hasAnimated])

  const initial = DIRECTION_INITIAL[direction] ?? 'opacity-0'

  return (
    <div
      ref={ref}
      className={`transition-all ${isVisible ? 'opacity-100 translate-y-0 translate-x-0 scale-100' : initial} ${className}`}
      style={{
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }}
    >
      {children}
    </div>
  )
}
