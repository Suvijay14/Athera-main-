'use client'

import { useFormState, useFormStatus } from 'react-dom'

import { signInAction, type AuthActionState } from '@/lib/auth/actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-4 w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
    >
      {pending ? 'Signing in…' : 'Sign in'}
    </button>
  )
}

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const [state, formAction] = useFormState<AuthActionState, FormData>(signInAction, {})

  return (
    <form action={formAction} className="mt-8 space-y-4">
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-neutral-800">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-neutral-800">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      {state.error ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  )
}
