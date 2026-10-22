'use client'

import { useEffect } from 'react'

import { useWorkspaceUi } from '@/components/workspace/workspace-ui-context'
import type { ViewDefinition } from '@/lib/db/schemas'

type WorkspaceBreadcrumbSyncProps = {
  spaceName: string
  activeView: ViewDefinition | null
}

export function WorkspaceBreadcrumbSync({ spaceName, activeView }: WorkspaceBreadcrumbSyncProps) {
  const { setBreadcrumbLabel } = useWorkspaceUi()

  useEffect(() => {
    const viewName = activeView?.name ?? 'List'
    setBreadcrumbLabel(`Spaces / ${spaceName} / ${viewName}`)
    return () => setBreadcrumbLabel(null)
  }, [spaceName, activeView, setBreadcrumbLabel])

  return null
}
