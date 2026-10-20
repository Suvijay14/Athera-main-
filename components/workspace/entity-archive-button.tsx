'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import { archiveEntityAction } from '@/app/workspace/entity-actions'
import { Button } from '@/components/ctc/ui/Button'

export function EntityArchiveButton({ entityId }: { entityId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!window.confirm('Archive this entity? Items keep their links.')) {
          return
        }
        startTransition(async () => {
          await archiveEntityAction(entityId)
          router.refresh()
        })
      }}
    >
      Archive
    </Button>
  )
}
