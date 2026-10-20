'use client'

import { useState } from 'react'

import { Button } from '@/components/ctc/ui/Button'
import { ToastContainer, type ToastItem } from '@/components/ctc/ui/Toast'

export default function ToastDemo() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const push = (type: ToastItem['type']) => {
    const id = crypto.randomUUID()
    setToasts((t) => [
      ...t,
      {
        id,
        type,
        title: `${type} toast`,
        description: 'Cut the Chaos toast pattern on Athera tokens.',
      },
    ])
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => push('success')}>
          Success
        </Button>
        <Button size="sm" variant="outline" onClick={() => push('info')}>
          Info
        </Button>
        <Button size="sm" variant="secondary" onClick={() => push('warning')}>
          Warning
        </Button>
        <Button size="sm" variant="destructive" onClick={() => push('error')}>
          Error
        </Button>
      </div>
      <ToastContainer toasts={toasts} onRemove={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </>
  )
}
