'use client'

import { useEffect, useState } from 'react'
import { Check, X, AlertTriangle, Info, Loader2 } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading'

export interface ToastItem {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
}

const TOAST_CONFIG = {
  success: { icon: Check, accent: 'border-l-primary-container' },
  error: { icon: X, accent: 'border-l-error' },
  warning: { icon: AlertTriangle, accent: 'border-l-secondary' },
  info: { icon: Info, accent: 'border-l-tertiary-container' },
  loading: { icon: Loader2, accent: 'border-l-outline' },
}

function ToastItemComponent({
  toast,
  onRemove,
}: {
  toast: ToastItem
  onRemove: (id: string) => void
}) {
  const [visible, setVisible] = useState(false)
  const config = TOAST_CONFIG[toast.type]
  const Icon = config.icon

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    if (toast.type !== 'loading' && toast.duration !== 0) {
      const dismissTimer = setTimeout(() => {
        setVisible(false)
        setTimeout(() => onRemove(toast.id), 350)
      }, toast.duration ?? 4000)
      return () => clearTimeout(dismissTimer)
    }
  }, [toast.duration, toast.id, toast.type, onRemove])

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3.5 bg-inverse-surface text-inverse-on-surface rounded-xl border-l-4 shadow-serenity-lg max-w-sm w-full transition-all duration-300 ${config.accent} ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <Icon
        size={16}
        className={`mt-0.5 shrink-0 ${toast.type === 'loading' ? 'animate-spin' : ''}`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{toast.title}</p>
        {toast.description && <p className="text-xs opacity-80 mt-0.5">{toast.description}</p>}
      </div>
      {toast.type !== 'loading' && (
        <button
          type="button"
          onClick={() => {
            setVisible(false)
            setTimeout(() => onRemove(toast.id), 350)
          }}
          className="opacity-70 hover:opacity-100"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}

export function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: ToastItem[]
  onRemove: (id: string) => void
}) {
  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      <div className="pointer-events-auto flex flex-col gap-2">
        {toasts.map((toast) => (
          <ToastItemComponent key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </div>
    </div>
  )
}
