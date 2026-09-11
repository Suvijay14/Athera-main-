'use client'

import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { usePendingFiles } from '@/components/PendingFilesContext'

export default function FileApprovalWidget() {
  const { pending, dismiss } = usePendingFiles()
  const [pos, setPos] = useState({ x: 0, y: 120 })
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(
    null
  )

  useEffect(() => {
    if (pending && typeof window !== 'undefined') {
      setPos({ x: Math.max(24, window.innerWidth / 2 - 160), y: 120 })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- reset position when a new batch arrives
  }, [pending?.id])

  if (!pending) return null

  function onPointerDown(e: React.PointerEvent) {
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return
    setPos({
      x: dragRef.current.origX + (e.clientX - dragRef.current.startX),
      y: dragRef.current.origY + (e.clientY - dragRef.current.startY),
    })
  }

  function onPointerUp() {
    dragRef.current = null
  }

  function onDragStart(e: React.DragEvent) {
    if (!pending) return
    e.dataTransfer.setData('application/x-athena-files', pending.id)
    e.dataTransfer.setData('text/plain', pending.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      className="fixed z-[60] w-[320px] card shadow-modal border-2 border-ochre animate-pulse-slow"
      style={{ left: pos.x, top: pos.y }}
      draggable
      onDragStart={onDragStart}
    >
      <div
        className="bg-ochre-light px-4 py-2 border-b border-ochre/30 cursor-grab active:cursor-grabbing select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-ochre">
              Waiting for approval
            </div>
            <div className="text-sm font-medium text-ink-primary mt-0.5">
              {pending.label} · {pending.files.length} items
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="text-ink-faint hover:text-ink-primary text-lg leading-none"
          >
            ×
          </button>
        </div>
      </div>

      <div className="p-3 max-h-[240px] overflow-y-auto">
        <p className="text-[10px] text-ink-muted mb-2">
          Drag this widget onto a Space in the sidebar or top tabs to add these files.
        </p>
        <div className="space-y-1">
          {pending.files.slice(0, 20).map((f) => (
            <div
              key={f.path}
              className="flex items-center gap-2 px-2 py-1.5 rounded bg-surface-container text-xs"
            >
              <span>{f.type === 'directory' ? '📁' : '📄'}</span>
              <span className="truncate text-ink-primary">{f.name}</span>
            </div>
          ))}
          {pending.files.length > 20 && (
            <div className="text-[10px] text-ink-faint px-2">
              +{pending.files.length - 20} more
            </div>
          )}
        </div>
      </div>

      <div className="px-3 py-2 border-t border-border-delicate bg-surface-vellum">
        <span className="text-[10px] text-ochre font-medium">↗ Drag to a Space to approve</span>
      </div>
    </div>
  )
}

/** Drop zone wrapper for space targets */
export function SpaceDropZone({
  slug,
  name,
  children,
  className,
  activeClassName,
}: {
  slug: string
  name: string
  children: React.ReactNode
  className?: string
  activeClassName?: string
}) {
  const { pending, approveForSpace } = usePendingFiles()
  const [over, setOver] = useState(false)

  if (!pending) {
    return <div className={className}>{children}</div>
  }

  return (
    <div
      className={clsx(className, over && (activeClassName ?? 'ring-2 ring-ochre bg-ochre-light/50'))}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={async (e) => {
        e.preventDefault()
        setOver(false)
        const id = e.dataTransfer.getData('application/x-athena-files')
        if (id === pending.id) await approveForSpace(slug, name)
      }}
    >
      {children}
    </div>
  )
}
