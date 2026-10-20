import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 text-neutral-800">
      <h1 className="text-3xl font-semibold text-neutral-900">Privacy & data</h1>
      <p className="mt-2 text-sm text-neutral-600">Last updated: October 2026</p>

      <section className="mt-8 space-y-4 text-sm leading-relaxed">
        <h2 className="text-lg font-medium text-neutral-900">Your data stays yours</h2>
        <p>
          Athera stores your workspace data in Supabase (PostgreSQL). Every table is protected with row-level
          security (RLS) so each account can only access its own workspace rows. We test cross-account isolation
          in our automated RLS suite.
        </p>
        <p>
          Data is encrypted in transit (HTTPS/TLS) and at rest using Supabase&apos;s platform defaults.
        </p>
        <p>
          We do not use your workspace content to train third-party or Athera models.
        </p>
      </section>

      <section className="mt-8 space-y-4 text-sm leading-relaxed">
        <h2 className="text-lg font-medium text-neutral-900">What goes to the LLM (Groq)</h2>
        <p>
          Optional cloud features send limited text to Groq for parsing or entity detection:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Work items:</strong> primarily the item <strong>title</strong> (and existing entity names in
            your space for matching). Item notes are not sent for title-based entity extraction.
          </li>
          <li>
            <strong>Notes pages (Task 16+):</strong> when you save notes, up to the first{' '}
            <strong>2,000 characters</strong> of note text may be sent to suggest entity names — not the full
            document if it is longer. This is more than &quot;titles only&quot; for notes.
          </li>
          <li>Command-bar view requests send your typed command text, not your full database.</li>
        </ul>
        <p>
          Note content used for entity extraction is processed by{' '}
          <a
            href="https://groq.com"
            className="text-primary underline-offset-2 hover:underline"
            rel="noopener noreferrer"
            target="_blank"
          >
            Groq
          </a>
          , our LLM provider. How that data is handled in transit, retention, and subprocessors is governed by
          Groq&apos;s terms and policies, not only by Athera&apos;s. We have not independently audited Groq&apos;s
          practices; if you need specific assurances, review their published documentation or contact them
          directly.
        </p>
      </section>

      <section className="mt-8 space-y-4 text-sm leading-relaxed">
        <h2 className="text-lg font-medium text-neutral-900">Billing</h2>
        <p>
          Paid plans are processed by Stripe. We store Stripe customer and subscription identifiers on your
          workspace; payment details stay with Stripe.
        </p>
      </section>

      <section className="mt-8 space-y-4 text-sm leading-relaxed">
        <h2 className="text-lg font-medium text-neutral-900">Open source & credits</h2>
        <p>Built with Next.js, React, Supabase, Tailwind CSS, TipTap, date-fns, Zod, Stripe, and other open-source libraries under permissive licenses (MIT, Apache-2.0, and similar). See <code className="text-xs">package.json</code> for the full dependency list.</p>
      </section>

      <p className="mt-10 text-sm">
        <Link href="/workspace/settings" className="text-primary underline-offset-2 hover:underline">
          Back to account settings
        </Link>
      </p>
    </main>
  )
}
