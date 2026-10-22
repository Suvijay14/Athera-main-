'use client'

import { useEffect } from 'react'

import { useWorkspaceUi } from '@/components/workspace/workspace-ui-context'

const STORAGE_KEY = 'athera_paste_week_import_count'

export function PasteWeekImportToast() {
  const { showActivityToast } = useWorkspaceUi()

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return
    }
    sessionStorage.removeItem(STORAGE_KEY)
    const count = Number.parseInt(raw, 10)
    if (!Number.isFinite(count) || count <= 0) {
      return
    }
    showActivityToast(`${count} items added from your list.`)
  }, [showActivityToast])

  return null
}

export function stashPasteWeekImportToast(count: number): void {
  if (typeof window === 'undefined') {
    return
  }
  sessionStorage.setItem(STORAGE_KEY, String(count))
}
