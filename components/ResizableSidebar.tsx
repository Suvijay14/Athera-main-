'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { LAYOUT_SIDEBAR_ID, readWidgetSize, saveWidgetSize } from '@/lib/widget-sizes'

interface ResizableSidebarProps {
  children: React.ReactNode
  main: React.ReactNode
  defaultWidth?: number
  minWidth?: number
  maxWidth?: number
}

export default function ResizableSidebar({
  children,
  main,
  defaultWidth = 300,
  minWidth = 220,
  maxWidth = 520,
}: ResizableSidebarProps) {
  const [width, setWidth] = useState(defaultWidth)
  const [ready, setReady] = useState(false)
  const dragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(defaultWidth)

  useEffect(() => {
    const saved = readWidgetSize(LAYOUT_SIDEBAR_ID).width
    if (saved != null) setWidth(Math.min(maxWidth, Math.max(minWidth, saved)))
    setReady(true)
  }, [minWidth, maxWidth])

  const clamp = useCallback(
    (value: number) => Math.min(maxWidth, Math.max(minWidth, value)),
    [minWidth, maxWidth]
  )

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault()
      dragging.current = true
      startX.current = e.clientX
      startWidth.current = width
      e.currentTarget.setPointerCapture(e.pointerId)
      document.body.style.cursor = 'ew-resize'
      document.body.style.userSelect = 'none'
    },
    [width]
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging.current) return
      setWidth(clamp(startWidth.current + (e.clientX - startX.current)))
    },
    [clamp]
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging.current) return
      dragging.current = false
      e.currentTarget.releasePointerCapture(e.pointerId)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      const next = clamp(startWidth.current + (e.clientX - startX.current))
      setWidth(next)
      saveWidgetSize(LAYOUT_SIDEBAR_ID, { width: next })
    },
    [clamp]
  )

  if (!ready) {
    return (
      <div className="flex gap-6">
        <aside style={{ width: defaultWidth }} className="flex-shrink-0 space-y-4">
          {children}
        </aside>
        <main className="flex-1 min-w-0">{main}</main>
      </div>
    )
  }

  return (
    <div className="flex gap-0 items-start">
      <aside style={{ width }} className="flex-shrink-0 space-y-4 pr-4">
        {children}
      </aside>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize sidebar"
        title="Drag to resize sidebar width"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={clsx(
          'group/split w-2 flex-shrink-0 self-stretch cursor-ew-resize',
          'flex items-center justify-center'
        )}
      >
        <span className="w-px h-full bg-border-delicate group-hover/split:bg-terracotta/40 transition-colors" />
      </div>

      <main className="flex-1 min-w-0 pl-2">{main}</main>
    </div>
  )
}
