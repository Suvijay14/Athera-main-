'use client'

import Link from 'next/link'
import { Suspense, useRef } from 'react'
import AtheraLogo from '@/components/brand/AtheraLogo'
import { PRODUCT_ENTRY_PATH } from '@/lib/routes/product-entry'
import WaitlistForm from '@/components/landing/WaitlistForm'
import HeroProductDemo from '@/components/landing/HeroProductDemo'
import AppMeshProblem from '@/components/landing/AppMeshProblem'
import ProblemSection from '@/components/landing/ProblemSection'
import SameMondayDemo from '@/components/landing/SameMondayDemo'
import PersonaPromptCard from '@/components/landing/PersonaPromptCard'
import PersonaUrlSync from '@/components/landing/PersonaUrlSync'
import LandingFeatureSections from '@/components/landing/LandingFeatureSections'
import TrustSection from '@/components/landing/TrustSection'
import FounderStory from '@/components/landing/FounderStory'
import { LandingPersonaProvider } from '@/components/landing/LandingPersonaContext'
import { CALENDLY_URL } from '@/lib/landing/constants'
import { trackLandingEvent } from '@/lib/landing/analytics'

function Section({
  id,
  children,
  className = '',
  tone = 'base',
}: {
  id?: string
  children: React.ReactNode
  className?: string
  tone?: 'base' | 'alt'
}) {
  return (
    <section
      id={id}
      className={`px-5 sm:px-8 py-14 sm:py-20 max-w-6xl mx-auto ${tone === 'alt' ? 'landing-section-alt' : 'landing-section'} ${className}`}
    >
      {children}
    </section>
  )
}

function LandingPageContent() {
  const pageRef = useRef<HTMLDivElement>(null)

  return (
    <div ref={pageRef} className="min-h-screen landing-page text-ink-primary snap-y snap-proximity">
      <Suspense fallback={null}>
        <PersonaUrlSync />
      </Suspense>

      <div
        id="landing-hero-viewport"
        className="landing-hero-grid w-full landing-section h-[min(100vh,900px)] min-h-0 flex flex-col overflow-hidden"
      >
        <header className="relative z-10 shrink-0 px-8 lg:px-16 pt-4 pb-2 max-w-[1280px] mx-auto w-full flex items-center justify-between gap-4">
          <AtheraLogo variant="inline" markSize={36} className="origin-left scale-[0.92] sm:scale-100" priority />
          <Link
            href={PRODUCT_ENTRY_PATH}
            onClick={() => trackLandingEvent('product_entry_click', { source: 'header' })}
            className="shrink-0 rounded-md border border-border-delicate bg-surface-paper px-4 py-2 text-sm font-semibold text-ink-primary shadow-sm hover:bg-surface-vellum transition-colors"
          >
            Take me to the product
          </Link>
        </header>

        <section
          id="landing-hero"
          className="relative z-10 flex-1 flex items-center px-8 lg:px-16 max-w-[1280px] mx-auto w-full min-h-0 pb-4"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
            <div className="min-w-0">
              <h1
                className="font-newsreader font-medium text-ink-primary max-w-[640px] text-balance"
                style={{
                  fontSize: 'clamp(44px, 5vw, 72px)',
                  lineHeight: 1.05,
                  letterSpacing: '-0.02em',
                }}
              >
                The software that sets itself up around how you work.
              </h1>
              <p
                className="mt-6 text-ink-secondary max-w-[520px] text-[18px] lg:text-[20px]"
                style={{ lineHeight: 1.55 }}
              >
                Add your work like a to-do list. Athera finds your clients, builds the structure, and
                tells you what&apos;s slipping. You approve every change.
              </p>
              <div className="mt-8 w-full max-w-[520px]">
                <WaitlistForm source="hero" layout="inline" size="hero" inputId="hero-email" />
              </div>
            </div>
            <div className="w-full min-w-0 flex justify-center lg:justify-end">
              <HeroProductDemo />
            </div>
          </div>
        </section>
      </div>

      <ProblemSection />

      <div className="landing-section-alt">
        <AppMeshProblem />
      </div>

      <Section tone="base">
        <h2 className="font-newsreader text-2xl sm:text-3xl text-center mb-10 leading-snug max-w-3xl mx-auto">
          ChatGPT helps when you remember to ask. Athera works when you forget.
        </h2>
        <SameMondayDemo />
      </Section>

      <PersonaPromptCard pageRef={pageRef} />

      <LandingFeatureSections />

      <TrustSection />

      <FounderStory />

      <Section id="early-access" tone="base" className="pb-20">
        <p className="text-center text-sm text-ink-muted mb-8 max-w-xl mx-auto">
          Coming soon: Today brief · Weekly recap · Ask Athera, a chat that answers from your own work
        </p>
        <div className="landing-card max-w-xl mx-auto p-8 sm:p-10 text-center">
          <h2 className="font-newsreader text-2xl sm:text-3xl mb-3">Get early access</h2>
          <p className="text-sm text-ink-secondary mb-6">One email. No spam.</p>
          <WaitlistForm source="footer" layout="stacked" inputId="footer-email" className="mx-auto" />
          <p className="mt-6 text-sm text-ink-secondary">
            Get free setup help and a say in what we build.
          </p>
          <a
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackLandingEvent('design_partner_click', { source: 'footer' })}
            className="mt-4 inline-flex items-center justify-center rounded-md border border-sage/40 bg-surface-paper px-5 py-2.5 text-sm font-semibold text-sage hover:bg-sage-light transition-colors"
          >
            Become a design partner
          </a>
        </div>
      </Section>

      <footer className="landing-section-alt px-5 pb-8 pt-4 text-center text-xs text-ink-faint">
        © {new Date().getFullYear()} Athera
      </footer>
    </div>
  )
}

export default function LandingMarketing() {
  return (
    <LandingPersonaProvider>
      <LandingPageContent />
    </LandingPersonaProvider>
  )
}
