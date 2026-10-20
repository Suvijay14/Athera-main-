/**
 * Pure checkbox ↔ work item sync planning (TipTap task items).
 */

export type NoteCheckboxState = {
  /** Stable id stored on the TipTap node (generated client-side once). */
  checkboxId: string
  text: string
  checked: boolean
  itemId: string | null
}

export type CheckboxCreateAction = {
  kind: 'create'
  checkboxId: string
  text: string
}

export type CheckboxCompletionAction = {
  kind: 'completion'
  itemId: string
  completedAt: string | null
}

export type CheckboxSyncAction = CheckboxCreateAction | CheckboxCompletionAction

function previousByCheckboxId(previous: NoteCheckboxState[]): Map<string, NoteCheckboxState> {
  return new Map(previous.map((c) => [c.checkboxId, c]))
}

function previousByItemId(previous: NoteCheckboxState[]): Map<string, NoteCheckboxState> {
  const m = new Map<string, NoteCheckboxState>()
  for (const c of previous) {
    if (c.itemId) {
      m.set(c.itemId, c)
    }
  }
  return m
}

/**
 * Given last-saved checkbox snapshot and current editor snapshot, return server actions.
 * Does not emit create for rows that already have itemId (prevents save loops after linking).
 */
export function planCheckboxSyncActions(
  previous: NoteCheckboxState[],
  current: NoteCheckboxState[],
  nowIso: string
): CheckboxSyncAction[] {
  const actions: CheckboxSyncAction[] = []
  const prevByCb = previousByCheckboxId(previous)
  const prevByItem = previousByItemId(previous)

  for (const row of current) {
    const prior = prevByCb.get(row.checkboxId)
    if (!row.itemId) {
      const isNew = !prior || !prior.itemId
      const textChanged = prior && prior.text !== row.text
      if (isNew && row.text.trim().length > 0) {
        actions.push({ kind: 'create', checkboxId: row.checkboxId, text: row.text.trim() })
      } else if (textChanged && prior && !prior.itemId && row.text.trim().length > 0) {
        actions.push({ kind: 'create', checkboxId: row.checkboxId, text: row.text.trim() })
      }
      continue
    }

    const priorForItem = prevByItem.get(row.itemId) ?? prior
    if (!priorForItem) {
      continue
    }
    if (priorForItem.checked === row.checked) {
      continue
    }
    actions.push({
      kind: 'completion',
      itemId: row.itemId,
      completedAt: row.checked ? nowIso : null,
    })
  }

  return actions
}

/** Merge created item ids back into checkbox rows by checkboxId. */
export function applyItemIdsToCheckboxStates(
  states: NoteCheckboxState[],
  created: { checkboxId: string; itemId: string }[]
): NoteCheckboxState[] {
  const map = new Map(created.map((c) => [c.checkboxId, c.itemId]))
  return states.map((s) => {
    const itemId = map.get(s.checkboxId)
    return itemId ? { ...s, itemId } : s
  })
}
