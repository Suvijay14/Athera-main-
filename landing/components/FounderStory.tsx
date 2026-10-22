'use client'

import type { PersonaKey } from '@/demo-data'
import { useLandingPersona } from '@/components/landing/LandingPersonaContext'

const COPY: Record<PersonaKey, string> = {
  freelancer:
    'I built Athera after watching freelancers juggle client work, invoices, and life admin in one endless list. You deserve software that learns your studio—not another app to configure.',
  coach:
    'I built Athera after watching tutors juggle sessions, invoices, and family texts in one endless list. You deserve software that learns your practice—not another app to configure.',
  founder:
    'I built Athera because startup weeks shouldn\'t mean re-building the same investor spreadsheet every Sunday. Your company and personal life should stay organized without a ops hire.',
  personal:
    'I built Athera as a parent who was tired of mixing school forms with grocery runs in one mental pile. Home and work stay separate when your tools notice the difference.',
}

export default function FounderStory() {
  const { persona } = useLandingPersona()

  return (
    <section className="landing-section-alt px-5 sm:px-8 py-14 sm:py-20 max-w-3xl mx-auto border-t border-[var(--border)] text-center">
      <h2 className="font-newsreader text-2xl sm:text-3xl text-ink-primary mb-6 leading-snug">Why we&apos;re building Athera</h2>
      <p className="text-lg text-ink-secondary leading-relaxed">{COPY[persona]}</p>
      <p className="mt-6 text-sm text-ink-muted">— Rheanna, founder</p>
    </section>
  )
}
