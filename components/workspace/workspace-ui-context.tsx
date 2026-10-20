'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { OPEN_COMMAND_BAR_EVENT } from '@/lib/workspace/open-command-bar'

import {
  AdaptationToast,
  type ActiveAdaptationToast,
} from '@/components/adaptation/adaptation-toast'

type WorkspaceUiContextValue = {
  selectedItemId: string | null
  openItem: (id: string) => void
  closeItem: () => void
  commandBarOpen: boolean
  openCommandBar: (opts?: { createMode?: boolean }) => void
  closeCommandBar: () => void
  commandCreateMode: boolean
  commandQuery: string
  setCommandQuery: (query: string) => void
  showActivityToast: (summary: string) => void
}

const WorkspaceUiContext = createContext<WorkspaceUiContextValue | null>(null)

export function WorkspaceUiProvider({ children }: { children: ReactNode }) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [commandBarOpen, setCommandBarOpen] = useState(false)
  const [commandCreateMode, setCommandCreateMode] = useState(false)
  const [commandQuery, setCommandQuery] = useState('')
  const [activityToast, setActivityToast] = useState<ActiveAdaptationToast | null>(null)

  const showActivityToast = useCallback((summary: string) => {
    setActivityToast({
      id: crypto.randomUUID(),
      summary,
      status: 'visible',
    })
  }, [])

  const openItem = useCallback((id: string) => {
    setSelectedItemId(id)
  }, [])

  const closeItem = useCallback(() => {
    setSelectedItemId(null)
  }, [])

  const openCommandBar = useCallback((opts?: { createMode?: boolean }) => {
    setCommandCreateMode(opts?.createMode ?? false)
    setCommandBarOpen(true)
  }, [])

  const closeCommandBar = useCallback(() => {
    setCommandBarOpen(false)
    setCommandCreateMode(false)
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandBarOpen((open) => {
          if (open) {
            setCommandCreateMode(false)
            return false
          }
          setCommandCreateMode(false)
          return true
        })
      }
    }
    function onOpenCommandBar() {
      setCommandCreateMode(false)
      setCommandBarOpen(true)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener(OPEN_COMMAND_BAR_EVENT, onOpenCommandBar)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener(OPEN_COMMAND_BAR_EVENT, onOpenCommandBar)
    }
  }, [])

  const value = useMemo(
    () => ({
      selectedItemId,
      openItem,
      closeItem,
      commandBarOpen,
      openCommandBar,
      closeCommandBar,
      commandCreateMode,
      commandQuery,
      setCommandQuery,
      showActivityToast,
    }),
    [
      selectedItemId,
      openItem,
      closeItem,
      commandBarOpen,
      openCommandBar,
      closeCommandBar,
      commandCreateMode,
      commandQuery,
      showActivityToast,
    ]
  )

  return (
    <WorkspaceUiContext.Provider value={value}>
      {children}
      <AdaptationToast
        toast={activityToast}
        onClose={() => setActivityToast(null)}
        onUpdate={(patch) => setActivityToast((t) => (t ? { ...t, ...patch } : t))}
      />
    </WorkspaceUiContext.Provider>
  )
}

export function useWorkspaceUi(): WorkspaceUiContextValue {
  const ctx = useContext(WorkspaceUiContext)
  if (!ctx) {
    throw new Error('useWorkspaceUi must be used within WorkspaceUiProvider')
  }
  return ctx
}
