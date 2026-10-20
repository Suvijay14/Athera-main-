'use client'

import type { JSONContent } from '@tiptap/core'
import Link from '@tiptap/extension-link'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useCallback, useEffect, useRef, useState } from 'react'

import { saveNotesPageAction } from '@/app/workspace/notes-actions'
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue'
import type { NoteCheckboxState } from '@/lib/workspace/notes/checkbox-sync'
import {
  extractCheckboxStatesFromDoc,
  mergeItemCompletionIntoDoc,
} from '@/lib/workspace/notes/parse-note-document'

const CustomTaskItem = TaskItem.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      checkboxId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-checkbox-id'),
        renderHTML: (attributes) =>
          attributes.checkboxId
            ? { 'data-checkbox-id': attributes.checkboxId as string }
            : {},
      },
      itemId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-item-id'),
        renderHTML: (attributes) =>
          attributes.itemId ? { 'data-item-id': attributes.itemId as string } : {},
      },
    }
  },
})

function ensureCheckboxIds(doc: JSONContent): JSONContent {
  function walk(node: JSONContent): JSONContent {
    if (node.type === 'taskItem') {
      const checkboxId =
        typeof node.attrs?.checkboxId === 'string' && node.attrs.checkboxId
          ? node.attrs.checkboxId
          : crypto.randomUUID()
      return {
        ...node,
        attrs: { ...node.attrs, checkboxId },
        content: Array.isArray(node.content) ? node.content.map(walk) : node.content,
      }
    }
    if (Array.isArray(node.content)) {
      return { ...node, content: node.content.map(walk) }
    }
    return node
  }
  return walk(doc)
}

type NotesEditorProps = {
  ownerType: 'space' | 'entity'
  ownerId: string
  spaceId: string
  entityId: string | null
  initialBody: JSONContent
  completionByItemId: Record<string, boolean>
  emptyGuidance: string
}

export function NotesEditor({
  ownerType,
  ownerId,
  spaceId,
  entityId,
  initialBody,
  completionByItemId,
  emptyGuidance,
}: NotesEditorProps) {
  const mergedInitial = mergeItemCompletionIntoDoc(initialBody, completionByItemId)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const lastCheckboxSnapshot = useRef<NoteCheckboxState[]>(
    extractCheckboxStatesFromDoc(mergedInitial)
  )
  const skipNextDebounceSave = useRef(false)
  const [docVersion, setDocVersion] = useState(0)
  const [editorText, setEditorText] = useState('')

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      TaskList,
      CustomTaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false }),
    ],
    content: mergedInitial,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none min-h-[240px] px-3 py-3 focus:outline-none [&_ul]:list-disc [&_ol]:list-decimal',
      },
    },
    onUpdate: ({ editor: ed }) => {
      setEditorText(ed.getText())
      setDocVersion((v) => v + 1)
      setSaveStatus('idle')
    },
  })

  const debouncedVersion = useDebouncedValue(docVersion, 2000)

  const persist = useCallback(async () => {
    if (!editor || skipNextDebounceSave.current) {
      skipNextDebounceSave.current = false
      return
    }
    const rawJson = editor.getJSON()
    const body = ensureCheckboxIds(rawJson)
    const bodyText = editor.getText()
    setSaveStatus('saving')
    setSaveError(null)
    try {
      const result = await saveNotesPageAction({
        ownerType,
        ownerId,
        spaceId,
        entityId,
        body: body as Record<string, unknown>,
        bodyText,
        previousCheckboxStates: lastCheckboxSnapshot.current,
      })
      lastCheckboxSnapshot.current = extractCheckboxStatesFromDoc(result.body)
      const linked = JSON.stringify(result.body) !== JSON.stringify(body)
      if (linked) {
        skipNextDebounceSave.current = true
        editor.commands.setContent(result.body, { emitUpdate: false })
      }
      setSaveStatus('saved')
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save notes')
      setSaveStatus('idle')
    }
  }, [editor, ownerType, ownerId, spaceId, entityId])

  useEffect(() => {
    if (debouncedVersion === 0) {
      return
    }
    void persist()
  }, [debouncedVersion, persist])

  const isEmpty = editorText.trim().length === 0

  return (
    <div className="rounded-lg border border-neutral-200 bg-white">
      {isEmpty ? (
        <p className="border-b border-neutral-100 px-3 py-2 text-xs text-neutral-500">{emptyGuidance}</p>
      ) : null}
      <EditorContent editor={editor} />
      <div className="flex items-center justify-between border-t border-neutral-100 px-3 py-2 text-xs text-neutral-500">
        <span>
          {saveStatus === 'saving'
            ? 'Saving…'
            : saveStatus === 'saved'
              ? 'Saved'
              : 'Autosave in 2s after you stop typing'}
        </span>
        {saveError ? <span className="text-red-600">{saveError}</span> : null}
      </div>
    </div>
  )
}
