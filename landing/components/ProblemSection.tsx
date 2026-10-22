import { SHOW_QUOTES } from '@/lib/landing/constants'

const QUOTES = [
  {
    text: 'I ended up always having a somewhat fragmented stack.',
    attribution: 'Robert, former tutoring business owner',
  },
  {
    text: 'If I had to learn different software, it would just be extra steps.',
    attribution: 'Yuri, test prep owner',
  },
] as const

export default function ProblemSection() {
  return (
    <section className="landing-section px-5 sm:px-8 py-16 sm:py-24 max-w-4xl mx-auto text-center border-t border-[var(--border)]">
      <p className="text-[11px] font-semibold tracking-[0.14em] text-terracotta uppercase mb-4">
        THE PROBLEM
      </p>
      <h2
        className="font-newsreader font-medium text-ink-primary text-balance leading-[1.08] tracking-[-0.02em] mx-auto max-w-[900px]"
        style={{ fontSize: 'clamp(40px, 5vw, 64px)' }}
      >
        You&apos;re running a business out of your head.
      </h2>
      <p className="mt-8 text-[20px] leading-[1.55] text-ink-secondary max-w-[680px] mx-auto text-pretty">
        Clients in your texts. Sessions in your calendar. Invoices in a spreadsheet. Ideas in your
        notes app. You know a real system would help, but building one is a second job, and you
        already have two. So things slip: a client goes quiet, a follow-up never happens, a Tuesday
        gets double-booked. Every tool is either too simple to run a business on, or too much work
        to set up.
      </p>

      {SHOW_QUOTES ? (
        <div className="mt-12 grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto text-left">
          {QUOTES.map((q) => (
            <figure
              key={q.attribution}
              className="landing-card bg-surface-paper border border-border-delicate px-5 py-4 shadow-none"
            >
              <blockquote className="text-sm sm:text-[15px] text-ink-primary leading-relaxed">
                &ldquo;{q.text}&rdquo;
              </blockquote>
              <figcaption className="mt-3 text-xs text-ink-muted">&mdash; {q.attribution}</figcaption>
            </figure>
          ))}
        </div>
      ) : null}
    </section>
  )
}
