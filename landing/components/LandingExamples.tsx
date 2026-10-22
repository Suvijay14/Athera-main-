'use client'

import { useLandingPersona } from '@/components/landing/LandingPersonaContext'

export default function LandingExamples() {
  const { pack } = useLandingPersona()

  return (
    <section className="landing-section px-5 sm:px-8 py-14 sm:py-20 max-w-6xl mx-auto border-y border-[var(--border)]">
      <h2 className="font-newsreader text-2xl sm:text-3xl text-center mb-10">Examples</h2>
      <div className="grid md:grid-cols-3 gap-5">
        {pack.examples.map((card) => (
          <article key={card.title} className="landing-card p-5 flex flex-col gap-4">
            <h3 className="font-semibold text-ink-primary">{card.title}</h3>
            <div>
              <p className="label-caps text-[10px] mb-1">Before</p>
              <p className="text-sm text-ink-muted leading-relaxed">{card.before}</p>
            </div>
            <div className="landing-card p-3 shadow-none">
              <p className="label-caps text-[10px] text-sage mb-1">After</p>
              <p className="text-sm text-ink-secondary leading-relaxed">{card.after}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
