import Link from 'next/link'

import { SignUpForm } from '@/components/auth/SignUpForm'

export default function SignUpPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-2xl font-semibold text-neutral-900">Create account</h1>
      <p className="mt-2 text-sm text-neutral-600">Start with a plain workspace.</p>
      <SignUpForm />
      <p className="mt-6 text-sm text-neutral-600">
        Already have an account?{' '}
        <Link className="font-medium text-neutral-900 underline" href="/login">
          Sign in
        </Link>
      </p>
    </main>
  )
}
