'use client'

import Sidebar from '@/components/v2/Sidebar'
import TopNav from '@/components/v2/TopNav'
import { ComponentLabProvider } from '@/context/ComponentLabContext'
import { ShellProvider } from '@/components/v2/shell/ShellContext'

export default function AppShellV2({ children }: { children: React.ReactNode }) {
  return (
    <ShellProvider>
      <ComponentLabProvider>
        <div className="ui-v2 flex h-screen bg-canvas-ambient overflow-hidden">
          <Sidebar />
          <div className="flex flex-col flex-1 min-w-0">
            <TopNav />
            <main className="flex-1 overflow-y-auto bg-canvas-ambient">{children}</main>
          </div>
        </div>
      </ComponentLabProvider>
    </ShellProvider>
  )
}
