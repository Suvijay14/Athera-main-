'use client'

import { createContext, useContext, type ReactNode } from 'react'

import {
  useWorkspaceCommandActions,
  type UseWorkspaceCommandActionsArgs,
} from '@/components/workspace/use-workspace-command-actions'
import type { CommandBarJumpTarget } from '@/lib/workspace/command-bar-search'

type WorkspaceCommandActionsValue = {
  busy: boolean
  defaultSpaceId: string | null
  jumpResultsForQuery: (query: string) => CommandBarJumpTarget[]
  submitQuery: (
    query: string,
    activeRow?: Parameters<
      typeof import('@/lib/workspace/command-bar-submit').decideCommandBarSubmit
    >[2]
  ) => Promise<void>
  runJump: (target: CommandBarJumpTarget) => void
  runViewRequest: (text: string) => Promise<boolean>
}

const WorkspaceCommandActionsContext = createContext<WorkspaceCommandActionsValue | null>(null)

export function WorkspaceCommandActionsProvider({
  children,
  ...args
}: UseWorkspaceCommandActionsArgs & { children: ReactNode }) {
  const actions = useWorkspaceCommandActions(args)
  return (
    <WorkspaceCommandActionsContext.Provider value={actions}>
      {children}
    </WorkspaceCommandActionsContext.Provider>
  )
}

export function useWorkspaceCommandActionsContext(): WorkspaceCommandActionsValue {
  const ctx = useContext(WorkspaceCommandActionsContext)
  if (!ctx) {
    throw new Error('useWorkspaceCommandActionsContext must be used within WorkspaceCommandActionsProvider')
  }
  return ctx
}
