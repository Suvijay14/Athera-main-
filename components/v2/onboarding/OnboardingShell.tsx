'use client'

import Link from 'next/link'
import clsx from 'clsx'
import BrandLockup from '@/components/v2/BrandLockup'
import type { OnboardingStep } from '@/lib/onboarding-storage'

const STEPS: { id: OnboardingStep; label: string; slug: string }[] = [
  { id: 1, label: 'Connect Sources', slug: 'connect-sources' },
  { id: 2, label: 'Synthesize Spaces', slug: 'synthesize-spaces' },
  { id: 3, label: 'Privacy Ledger', slug: 'privacy-ledger' },
  { id: 4, label: 'Ready', slug: 'ready' },
]

export default function OnboardingShell({
  step,
  children,
  onStepClick,
}: {
  step: OnboardingStep
  children: React.ReactNode
  onStepClick?: (step: OnboardingStep) => void
}) {
  return (
    <div className="min-h-screen flex flex-col bg-surface-container-low text-on-surface">
      <header className="w-full h-20 flex items-center px-margin md:px-margin-tablet lg:px-margin-desktop border-b border-border-serenity/60">
        <div className="w-full max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Link href="/">
            <BrandLockup />
          </Link>
          <nav className="hidden md:flex items-center gap-space-lg">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-space-lg">
                {i > 0 && (
                  <span className="material-symbols-outlined text-[16px] text-outline-variant">
                    chevron_right
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onStepClick?.(s.id)}
                  className="flex items-center gap-space-sm group"
                >
                  <span
                    className={clsx(
                      'w-6 h-6 rounded-full flex items-center justify-center text-label-sm font-jakarta',
                      step === s.id
                        ? 'bg-primary text-on-primary'
                        : step > s.id
                          ? 'bg-primary-container text-on-primary'
                          : 'bg-secondary-container text-on-secondary-container'
                    )}
                  >
                    {s.id}
                  </span>
                  <span
                    className={clsx(
                      'font-jakarta text-label-md transition-colors',
                      step === s.id
                        ? 'text-primary font-bold'
                        : 'text-on-surface-variant group-hover:text-on-surface'
                    )}
                  >
                    {s.label}
                  </span>
                </button>
              </div>
            ))}
          </nav>
          <Link
            href="/setup"
            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
            aria-label="Voice setup help"
          >
            <span className="material-symbols-outlined text-[20px]">help_outline</span>
          </Link>
        </div>
      </header>
      <main className="flex-1 w-full max-w-4xl mx-auto px-margin md:px-margin-tablet py-space-xl flex flex-col">
        {children}
      </main>
      <footer className="py-4 text-center text-body-sm text-secondary border-t border-border-serenity/50">
        Athera Life OS · Encrypted &amp; Private by Design
      </footer>
    </div>
  )
}
