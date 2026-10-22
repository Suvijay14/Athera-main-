'use client'

import clsx from 'clsx'

export type FeatureSectionProps = {
  index: string
  label: string
  headline: string
  body: string
  pill: string
  demo: React.ReactNode
  reverse?: boolean
}

export default function FeatureSection({
  index,
  label,
  headline,
  body,
  pill,
  demo,
  reverse,
}: FeatureSectionProps) {
  return (
    <section className="landing-section px-5 sm:px-8 py-14 sm:py-20 max-w-6xl mx-auto border-t border-[var(--border)]">
      <div
        className={clsx(
          'grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center',
          reverse && 'lg:[&>*:first-child]:order-2 lg:[&>*:last-child]:order-1'
        )}
      >
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-terracotta uppercase mb-3">
            {index} / {label}
          </p>
          <h2 className="font-newsreader text-2xl sm:text-3xl text-ink-primary leading-snug text-balance">
            {headline}
          </h2>
          <p className="mt-4 text-ink-secondary text-lg leading-relaxed max-w-lg">{body}</p>
          <span className="inline-flex mt-6 text-[11px] font-semibold tracking-wide uppercase text-terracotta border border-terracotta/45 rounded-full px-3 py-1.5">
            {pill}
          </span>
        </div>
        <div className="w-full min-w-0">{demo}</div>
      </div>
    </section>
  )
}
