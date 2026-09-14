'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { readWidgetSize, removeWidgetSizeFields, saveWidgetSize } from '@/lib/widget-sizes'

type ResizeAxis = 'vertical' | 'horizontal' | 'both'

interface ResizableWidgetProps {
  id: string
  children: React.ReactNode
  defaultHeight?: number
  minHeight?: number
  maxHeight?: number
  defaultWidth?: number
  minWidth?: number
  maxWidth?: number
  /** When true, widget grows to fill remaining flex space until user sets an explicit width */
  flex?: boolean
  className?: string
}

function Grip({ vertical }: { vertical?: boolean }) {
  return (
    <span
      className={clsx(
        'flex rounded-full bg-surface-container/90 border border-border-delicate shadow-sm',
        vertical ? 'flex-col gap-0.5 px-0.5 py-1.5' : 'gap-0.5 px-1.5 py-0.5'
      )}
    >
      <span className="w-1 h-1 rounded-full bg-ink-faint" />
      <span className="w-1 h-1 rounded-full bg-ink-faint" />
      <span className="w-1 h-1 rounded-full bg-ink-faint" />
    </span>
  )
}

export default function ResizableWidget({
  id,
  children,
  defaultHeight = 280,
  minHeight = 140,
  maxHeight = 720,
  defaultWidth,
  minWidth = 220,
  maxWidth = 1200,
  flex = false,
  className,
}: ResizableWidgetProps) {
  const [height, setHeight] = useState(defaultHeight)
  const [width, setWidth] = useState<number | null>(defaultWidth ?? null)
  const [ready, setReady] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const drag = useRef<{
    axis: ResizeAxis
    startX: number
    startY: number
    startWidth: number
    startHeight: number
  } | null>(null)

  useEffect(() => {
    const saved = readWidgetSize(id)
    if (saved.height != null) {
      setHeight(Math.min(maxHeight, Math.max(minHeight, saved.height)))
    }
    if (saved.width != null) {
      setWidth(Math.min(maxWidth, Math.max(minWidth, saved.width)))
    } else if (defaultWidth != null) {
      setWidth(defaultWidth)
    }
    setReady(true)
  }, [id, minHeight, maxHeight, minWidth, maxWidth, defaultWidth])

  const clampHeight = useCallback(
    (value: number) => Math.min(maxHeight, Math.max(minHeight, value)),
    [minHeight, maxHeight]
  )

  const clampWidth = useCallback(
    (value: number) => {
      const parentWidth = rootRef.current?.parentElement?.clientWidth
      const cap = parentWidth ? Math.min(maxWidth, parentWidth) : maxWidth
      return Math.min(cap, Math.max(minWidth, value))
    },
    [minWidth, maxWidth]
  )

  const beginDrag = useCallback(
    (axis: ResizeAxis) => (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      const currentWidth =
        width ??
        rootRef.current?.getBoundingClientRect().width ??
        defaultWidth ??
        minWidth

      drag.current = {
        axis,
        startX: e.clientX,
        startY: e.clientY,
        startWidth: currentWidth,
        startHeight: height,
      }

      e.currentTarget.setPointerCapture(e.pointerId)
      document.body.style.userSelect = 'none'
      document.body.style.cursor =
        axis === 'both' ? 'nwse-resize' : axis === 'horizontal' ? 'ew-resize' : 'ns-resize'
    },
    [defaultWidth, height, minWidth, width]
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!drag.current) return
      const { axis, startX, startY, startWidth, startHeight } = drag.current

      if (axis === 'vertical' || axis === 'both') {
        setHeight(clampHeight(startHeight + (e.clientY - startY)))
      }
      if (axis === 'horizontal' || axis === 'both') {
        setWidth(clampWidth(startWidth + (e.clientX - startX)))
      }
    },
    [clampHeight, clampWidth]
  )

  const endDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!drag.current) return

      const { axis, startX, startY, startWidth, startHeight } = drag.current
      drag.current = null
      e.currentTarget.releasePointerCapture(e.pointerId)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''

      const patch: { height?: number; width?: number } = {}

      if (axis === 'vertical' || axis === 'both') {
        const nextHeight = clampHeight(startHeight + (e.clientY - startY))
        setHeight(nextHeight)
        patch.height = nextHeight
      }
      if (axis === 'horizontal' || axis === 'both') {
        const nextWidth = clampWidth(startWidth + (e.clientX - startX))
        setWidth(nextWidth)
        patch.width = nextWidth
      }

      saveWidgetSize(id, patch)
    },
    [clampHeight, clampWidth, id]
  )

  const resetSize = useCallback(
    (axis: ResizeAxis) => {
      const fields: ('height' | 'width')[] = []
      if (axis === 'vertical' || axis === 'both') {
        setHeight(defaultHeight)
        fields.push('height')
      }
      if (axis === 'horizontal' || axis === 'both') {
        setWidth(defaultWidth ?? null)
        fields.push('width')
      }
      removeWidgetSizeFields(id, fields)
    },
    [defaultHeight, defaultWidth, id]
  )

  const handleProps = (axis: ResizeAxis) => ({
    onPointerDown: beginDrag(axis),
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  })

  if (!ready) {
    return (
      <div
        className={clsx('rounded-lg', flex && 'flex-1 min-w-0', className)}
        style={{
          height: defaultHeight,
          width: defaultWidth ?? (flex ? undefined : '100%'),
        }}
      >
        <div className="h-full overflow-hidden rounded-lg">{children}</div>
      </div>
    )
  }

  return (
    <div
      ref={rootRef}
      className={clsx(
        'group/widget relative flex flex-col rounded-lg overflow-hidden',
        flex && width == null && 'flex-1 min-w-0',
        className
      )}
      style={{
        height,
        width: width ?? (flex ? undefined : '100%'),
        maxWidth: '100%',
      }}
    >
      <div className="flex-1 min-h-0 min-w-0 w-full overflow-hidden rounded-lg">
        <div className="h-full w-full min-h-0 min-w-0 overflow-hidden pb-3 pr-3">{children}</div>
      </div>

      {/* Bottom — vertical */}
      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label={`Resize ${id} height`}
        title="Drag to resize height · double-click to reset"
        onDoubleClick={() => resetSize('vertical')}
        {...handleProps('vertical')}
        className={clsx(
          'absolute inset-x-3 bottom-0 h-3 cursor-ns-resize z-10',
          'flex items-end justify-center pb-0.5',
          'opacity-0 group-hover/widget:opacity-100 focus-visible:opacity-100 transition-opacity'
        )}
      >
        <Grip />
      </div>

      {/* Right — horizontal */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={`Resize ${id} width`}
        title="Drag to resize width · double-click to reset"
        onDoubleClick={() => resetSize('horizontal')}
        {...handleProps('horizontal')}
        className={clsx(
          'absolute inset-y-3 right-0 w-3 cursor-ew-resize z-10',
          'flex items-center justify-end pr-0.5',
          'opacity-0 group-hover/widget:opacity-100 focus-visible:opacity-100 transition-opacity'
        )}
      >
        <Grip vertical />
      </div>

      {/* Corner — both */}
      <div
        role="separator"
        aria-label={`Resize ${id} width and height`}
        title="Drag to resize both · double-click to reset"
        onDoubleClick={() => resetSize('both')}
        {...handleProps('both')}
        className={clsx(
          'absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize z-20',
          'flex items-end justify-end p-0.5',
          'opacity-0 group-hover/widget:opacity-100 focus-visible:opacity-100 transition-opacity'
        )}
      >
        <span className="w-2 h-2 rounded-sm bg-ink-faint/70 border border-border-delicate" />
      </div>
    </div>
  )
}
