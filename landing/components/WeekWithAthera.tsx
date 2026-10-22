'use client'

import { Bell, LayoutGrid, Repeat, Sparkles, TrendingUp } from 'lucide-react'
import { WEEK_WITH_ATHERA } from '@/demo-data'
import { useLandingPersona } from '@/components/landing/LandingPersonaContext'

const ENTRY_ICONS = [Sparkles, Bell, Repeat, LayoutGrid, TrendingUp] as const

export default function WeekWithAthera() {
  const { persona } = useLandingPersona()
  const entries = WEEK_WITH_ATHERA[persona]

  return (
    <section className="landing-section px-5 sm:px-8 py-14 sm:py-20 max-w-3xl mx-auto border-t border-[var(--border)]">
      <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-terracotta text-center mb-3">
        A week with Athera
      </p>
      <h2 className="font-newsreader text-2xl sm:text-3xl text-center text-ink-primary mb-12 sm:mb-14 leading-snug">
        From catching up to caught up.
      </h2>

      <div className="relative pl-8 sm:pl-10">
        <div
          className="absolute left-[7px] sm:left-[9px] top-2 bottom-2 w-px bg-sage/45"
          aria-hidden
        />

        <ul className="space-y-10 sm:space-y-12">
          {entries.map((entry, index) => {
            const Icon = ENTRY_ICONS[index] ?? Sparkles
            return (
              <li key={`${persona}-${entry.day}`} className="relative">
                <span
                  className="absolute -left-8 sm:-left-10 top-1.5 flex h-[15px] w-[15px] items-center justify-center rounded-full bg-terracotta ring-4 ring-[var(--surface-paper)]"
                  aria-hidden
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-terracotta">
                      {entry.day}
                    </p>
                    {entry.comingSoon ? (
                      <span className="text-[9px] font-semibold uppercase tracking-wide text-ink-muted border border-border-delicate rounded-full px-2 py-0.5">
                        Coming soon
                      </span>
                    ) : null}
                  </div>
                  <div className="flex gap-2.5 items-start">
                    <Icon className="w-4 h-4 text-sage shrink-0 mt-1" aria-hidden />
                    <div>
                      <h3 className="font-newsreader text-lg sm:text-xl text-ink-primary leading-snug">
                        {entry.title}
                      </h3>
                      <p className="mt-1.5 text-sm sm:text-[15px] text-ink-muted leading-relaxed max-w-xl">
                        {entry.body}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
