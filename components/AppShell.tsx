'use client'

import Sidebar from '@/components/Sidebar'
import TopNav from '@/components/TopNav'
import { VoiceAssistantProvider } from '@/components/VoiceAssistant'
import { PendingFilesProvider } from '@/components/PendingFilesContext'
import FileApprovalWidget from '@/components/FileApprovalWidget'

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <PendingFilesProvider>
      <VoiceAssistantProvider>
        <div className="flex h-screen bg-canvas-base overflow-hidden">
          <Sidebar />
          <div className="flex flex-col flex-1 min-w-0">
            <TopNav />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </div>
        <FileApprovalWidget />
      </VoiceAssistantProvider>
    </PendingFilesProvider>
  )
}
