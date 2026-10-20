import Link from 'next/link'

export function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4">
      <div className="max-w-md text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">Athera</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900">
          Your workspace, shaped around how you work
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-neutral-600">
          Sign in to pick up where you left off. New here? Create an account and we&apos;ll set up
          your first space in a minute.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Sign in
        </Link>
      </div>
    </main>
  )
}
