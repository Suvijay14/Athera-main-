import Link from 'next/link'
import { FileText } from 'lucide-react'

/** Standing entry point to the full paste-week flow (not inline import). */
export function OverviewPasteWeekCard() {
  return (
    <section
      className="mb-6 rounded-xl border border-border-delicate bg-surface-paper px-4 py-4 sm:px-5"
      aria-labelledby="overview-paste-week-heading"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-container text-ink-muted"
            aria-hidden
          >
            <FileText size={18} />
          </span>
          <div className="min-w-0">
            <h2
              id="overview-paste-week-heading"
              className="font-newsreader text-lg font-medium leading-snug text-ink-primary"
            >
              Paste your week. Athera takes it from there.
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Copy from your notes app, an email, or a spreadsheet — no setup, no templates.
            </p>
          </div>
        </div>
        <Link
          href="/workspace/paste-week"
          className="shrink-0 rounded-full bg-ink-primary px-4 py-2.5 text-center text-sm font-medium text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40 sm:self-center"
        >
          Paste your week
        </Link>
      </div>
    </section>
  )
}
