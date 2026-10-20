import type { Task } from '@/lib/types'

/** @deprecated Legacy UI #1 filesystem spaces — do not link from merged shell. */
export interface WorkspaceDef {
  id: string
  label: string
  href: string
  icon: string
  accentBg: string
  accentText: string
  taskFilter: (task: Task) => boolean
}

/** Empty — legacy /school,/work,/personal routes redirect to workspace overview. */
export const CORE_WORKSPACES: WorkspaceDef[] = []

export function workspaceFromPath(_pathname: string): WorkspaceDef | null {
  return null
}
