'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

import { useWorkspaceUi } from '@/components/workspace/workspace-ui-context'

export function OpenItemFromQuery() {
  const params = useSearchParams()
  const { openItem } = useWorkspaceUi()

  useEffect(() => {
    const id = params.get('item')
    if (id) {
      openItem(id)
    }
  }, [params, openItem])

  return null
}
