'use client'

import { useState, type ReactNode } from 'react'

import { AppSidebar } from '@/components/workspace/app-sidebar'
import { CommandBar } from '@/components/workspace/command-bar'
import { WorkspaceCommandActionsProvider } from '@/components/workspace/workspace-command-actions-context'
import { WorkspaceTopBar } from '@/components/workspace/workspace-top-bar'
import { WorkspaceUiProvider } from '@/components/workspace/workspace-ui-context'
import type { Entity, FieldDefinition, Space, ViewDefinition } from '@/lib/db/schemas'

export type JumpItem = {
  id: string
  title: string
  spaceId: string
  startAt: string | null
  dueDate: string | null
}

type WorkspaceShellProps = {
  workspaceName: string
  defaultSpaceId: string
  quietEntityIds: string[]
  spaces: Space[]
  itemCountsBySpace: Record<string, number>
  jumpItems: JumpItem[]
  fields: FieldDefinition[]
  views: ViewDefinition[]
  entities: Entity[]
  notePages?: {
    pageId: string
    ownerType: string
    ownerId: string
    bodyText: string
  }[]
  userEmail?: string
  /** When true, render inside UI #1 shell (no duplicate sidebar/top bar). */
  embedded?: boolean
  children: ReactNode
}

export function WorkspaceShell({
  workspaceName,
  defaultSpaceId,
  quietEntityIds,
  spaces,
  itemCountsBySpace,
  jumpItems,
  fields,
  views,
  entities,
  notePages = [],
  userEmail,
  embedded = false,
  children,
}: WorkspaceShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const activeSpaces = spaces.filter((s) => !s.archivedAt)

  return (
    <WorkspaceUiProvider>
      <WorkspaceCommandActionsProvider
        items={jumpItems}
        spaces={activeSpaces}
        entities={entities}
        notePages={notePages}
      >
        <div className={embedded ? 'flex min-h-0 flex-1 flex-col bg-canvas-ambient' : 'flex min-h-screen bg-neutral-50'}>
          {!embedded ? (
            <AppSidebar
              spaces={spaces}
              entities={entities}
              itemCountsBySpace={itemCountsBySpace}
              quietEntityIds={quietEntityIds}
              defaultSpaceId={defaultSpaceId}
              userEmail={userEmail}
              workspaceName={workspaceName}
              mobileOpen={mobileOpen}
              onMobileOpenChange={setMobileOpen}
            />
          ) : null}
          <div className={embedded ? 'flex min-h-0 flex-1 flex-col' : 'flex min-w-0 flex-1 flex-col pt-14 md:pt-0'}>
            {!embedded ? <WorkspaceTopBar spaces={spaces} /> : null}
            <div className="min-h-0 flex-1">{children}</div>
          </div>
        </div>
        <CommandBar
          items={jumpItems}
          spaces={activeSpaces}
          fields={fields}
          views={views}
          entities={entities}
          notePages={notePages}
        />
      </WorkspaceCommandActionsProvider>
    </WorkspaceUiProvider>
  )
}
