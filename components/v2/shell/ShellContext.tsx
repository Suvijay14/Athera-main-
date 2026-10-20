'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { readSidebarCollapsed, writeSidebarCollapsed } from '@/lib/sidebar-preferences'

interface ShellContextValue {
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  toggleCollapsed: () => void
  mobileOpen: boolean
  setMobileOpen: (v: boolean) => void
}

const ShellContext = createContext<ShellContextValue | null>(null)

export function ShellProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsedState] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setCollapsedState(readSidebarCollapsed())
  }, [])

  const setCollapsed = useCallback((v: boolean) => {
    setCollapsedState(v)
    writeSidebarCollapsed(v)
  }, [])

  const toggleCollapsed = useCallback(() => {
    setCollapsedState((prev) => {
      const next = !prev
      writeSidebarCollapsed(next)
      return next
    })
  }, [])

  return (
    <ShellContext.Provider
      value={{ collapsed, setCollapsed, toggleCollapsed, mobileOpen, setMobileOpen }}
    >
      {children}
    </ShellContext.Provider>
  )
}

export function useShell() {
  const ctx = useContext(ShellContext)
  if (!ctx) throw new Error('useShell must be used within ShellProvider')
  return ctx
}
