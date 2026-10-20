import type { Metadata } from 'next'
import './globals.css'
import { ShellGate } from '@/components/ShellGate'

export const metadata: Metadata = {
  title: 'Athera · Life, in context',
  description: 'Your unified day — Contextual Serenity UI 2.0',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ShellGate>{children}</ShellGate>
      </body>
    </html>
  )
}
