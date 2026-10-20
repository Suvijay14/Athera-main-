'use client'

import { useRef, useState, useCallback, type ReactNode, type PointerEvent } from 'react'
import { Archive, Trash2 } from 'lucide-react'

interface SwipeableTaskRowProps {
  children: ReactNode
  onDelete: () => void
  onArchive: () => void
}

const THRESHOLD = 80
const MAX_SWIPE = 160

export function SwipeableTaskRow({ children, onDelete, onArchive }: SwipeableTaskRowProps) {
  const [offset, setOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startX = useRef(0)
  const pointerDownBaseRef = useRef(0)
  const offsetRef = useRef(0)
  const draggingRef = useRef(false)
  const surfaceRef = useRef<HTMLDivElement>(null)

  const handlePointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== undefined && e.button !== 0) return
    pointerDownBaseRef.current = offsetRef.current
    startX.current = e.clientX
    draggingRef.current = true
    setIsDragging(true)
    surfaceRef.current?.setPointerCapture(e.pointerId)
  }, [])

  const handlePointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return
    const raw = pointerDownBaseRef.current + (e.clientX - startX.current)
    const clamped = Math.max(Math.min(raw, 0), -MAX_SWIPE)
    offsetRef.current = clamped
    setOffset(clamped)
  }, [])

  const handlePointerUp = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return
    draggingRef.current = false
    setIsDragging(false)
    try {
      surfaceRef.current?.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    if (offsetRef.current < -THRESHOLD) {
      offsetRef.current = -MAX_SWIPE
      setOffset(-MAX_SWIPE)
    } else {
      offsetRef.current = 0
      setOffset(0)
    }
  }, [])

  return (
    <div className="relative overflow-hidden rounded-xl border border-border-serenity bg-surface-container-lowest">
      <div className="absolute inset-y-0 right-0 flex">
        <button
          type="button"
          onClick={onArchive}
          className="w-20 bg-secondary/20 flex items-center justify-center text-on-surface"
        >
          <Archive size={18} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="w-20 bg-error/20 flex items-center justify-center text-error"
        >
          <Trash2 size={18} />
        </button>
      </div>
      <div
        ref={surfaceRef}
        className={`relative bg-surface-container-lowest touch-pan-y ${isDragging ? '' : 'transition-transform duration-200'}`}
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {children}
      </div>
    </div>
  )
}
