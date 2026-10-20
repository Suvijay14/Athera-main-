import type { JSONContent } from '@tiptap/core'

import type { NoteCheckboxState } from './checkbox-sync'

function collectFromNode(node: JSONContent, out: NoteCheckboxState[]): void {
  if (node.type === 'taskItem') {
    const checkboxId =
      typeof node.attrs?.checkboxId === 'string' && node.attrs.checkboxId.length > 0
        ? node.attrs.checkboxId
        : ''
    const itemId =
      typeof node.attrs?.itemId === 'string' && node.attrs.itemId.length > 0
        ? node.attrs.itemId
        : null
    const checked = node.attrs?.checked === true
    let text = ''
    if (Array.isArray(node.content)) {
      for (const child of node.content) {
        if (child.type === 'paragraph' && Array.isArray(child.content)) {
          for (const inline of child.content) {
            if (inline.type === 'text' && typeof inline.text === 'string') {
              text += inline.text
            }
          }
        } else if (child.type === 'text' && typeof child.text === 'string') {
          text += child.text
        }
      }
    }
    if (checkboxId) {
      out.push({ checkboxId, text: text.trim(), checked, itemId })
    }
  }
  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      collectFromNode(child, out)
    }
  }
}

export function extractCheckboxStatesFromDoc(doc: JSONContent): NoteCheckboxState[] {
  const out: NoteCheckboxState[] = []
  collectFromNode(doc, out)
  return out
}

/** Apply item completion from DB onto taskItem nodes on load. */
export function mergeItemCompletionIntoDoc(
  doc: JSONContent,
  completionByItemId: Record<string, boolean>
): JSONContent {
  function walk(node: JSONContent): JSONContent {
    if (node.type === 'taskItem' && typeof node.attrs?.itemId === 'string') {
      const itemId = node.attrs.itemId as string
      if (itemId in completionByItemId) {
        return {
          ...node,
          attrs: { ...node.attrs, checked: completionByItemId[itemId] },
        }
      }
    }
    if (Array.isArray(node.content)) {
      return { ...node, content: node.content.map(walk) }
    }
    return node
  }
  return walk(doc)
}

export function patchCheckboxItemIdsInDoc(
  doc: JSONContent,
  links: { checkboxId: string; itemId: string }[]
): JSONContent {
  const map = new Map(links.map((l) => [l.checkboxId, l.itemId]))
  function walk(node: JSONContent): JSONContent {
    if (node.type === 'taskItem' && typeof node.attrs?.checkboxId === 'string') {
      const itemId = map.get(node.attrs.checkboxId as string)
      if (itemId) {
        return { ...node, attrs: { ...node.attrs, itemId } }
      }
    }
    if (Array.isArray(node.content)) {
      return { ...node, content: node.content.map(walk) }
    }
    return node
  }
  return walk(doc)
}
