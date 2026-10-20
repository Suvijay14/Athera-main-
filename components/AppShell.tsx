'use client'

import { usePathname } from 'next/navigation'
import { VoiceAssistantProvider } from '@/components/VoiceAssistant'
import { PendingFilesProvider } from '@/components/PendingFilesContext'
import FileApprovalWidget from '@/components/FileApprovalWidget'
import AppShellV1 from '@/components/v1/AppShell'
import AppShellV2 from '@/components/v2/AppShell'
import { useUiVersion } from '@/lib/hooks/useUiVersion'

function CoreProviders({ children }: { children: React.ReactNode }) {
  return (
    <PendingFilesProvider>
      <VoiceAssistantProvider>
        {children}
        <FileApprovalWidget />
      </VoiceAssistantProvider>
    </PendingFilesProvider>
  )
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const version = useUiVersion()
  const isMinimalShell =
    pathname?.startsWith('/onboarding') ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/privacy'

  if (isMinimalShell) {
    const plainAuth =
      pathname === '/login' || pathname === '/signup' || pathname === '/privacy'
    if (plainAuth) {
      return <div className="min-h-screen bg-neutral-50">{children}</div>
    }
    return (
      <CoreProviders>
        <div className="ui-v2 min-h-screen bg-surface-container-low">{children}</div>
      </CoreProviders>
    )
  }

  if (version === '1') {
    return (
      <CoreProviders>
        <div className="ui-v1">
          <AppShellV1>{children}</AppShellV1>
        </div>
      </CoreProviders>
    )
  }

  return (
    <CoreProviders>
      <AppShellV2>{children}</AppShellV2>
    </CoreProviders>
  )
}
