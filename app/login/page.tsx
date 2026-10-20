import Link from 'next/link'

import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string }
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-2xl font-semibold text-neutral-900">Sign in</h1>
      <p className="mt-2 text-sm text-neutral-600">Access your workspace.</p>
      <LoginForm nextPath={searchParams.next} />
      <p className="mt-6 text-sm text-neutral-600">
        No account?{' '}
        <Link className="font-medium text-neutral-900 underline" href="/signup">
          Sign up
        </Link>
      </p>
    </main>
  )
}
