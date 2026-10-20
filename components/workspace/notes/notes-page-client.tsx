'use client'

import type { JSONContent } from '@tiptap/core'

import { NotesEditor } from '@/components/workspace/notes/notes-editor'

type NotesPageClientProps = {
  ownerType: 'space' | 'entity'
  ownerId: string
  spaceId: string
  entityId: string | null
  initialBody: JSONContent
  completionByItemId: Record<string, boolean>
  guidance: string
}

export function NotesPageClient(props: NotesPageClientProps) {
  return <NotesEditor {...props} emptyGuidance={props.guidance} />
}
