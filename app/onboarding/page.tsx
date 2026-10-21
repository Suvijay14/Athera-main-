'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { useFormState } from 'react-dom'

import {
  completeBrainDumpOnboardingAction,
  completeOnboardingPersonaAction,
  skipOnboardingToWorkspaceAction,
  type BrainDumpActionState,
} from '@/lib/onboarding/actions'
import type { OnboardingPersona } from '@/lib/onboarding/persona'
import { onboardingPersonaSchema } from '@/lib/onboarding/persona'

function personaFromReferral(raw: string | null): OnboardingPersona | null {
  if (!raw) {
    return null
  }
  const parsed = onboardingPersonaSchema.safeParse(raw)
  return parsed.success ? parsed.data : null
}

export default function WorkspaceOnboardingPage() {
  const searchParams = useSearchParams()
  const referralPersona = personaFromReferral(searchParams.get('persona'))
  const [pending, startTransition] = useTransition()
  const referralHandled = useRef(false)
  const [state, formAction] = useFormState<BrainDumpActionState, FormData>(
    completeBrainDumpOnboardingAction,
    {}
  )

  useEffect(() => {
    if (!referralPersona || referralHandled.current) {
      return
    }
    referralHandled.current = true
    startTransition(() => {
      void completeOnboardingPersonaAction({ persona: referralPersona })
    })
  }, [referralPersona])

  if (referralPersona) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-16">
        <p className="text-sm text-neutral-600">Setting up your workspace…</p>
      </main>
    )
  }

  function skip() {
    startTransition(() => {
      void skipOnboardingToWorkspaceAction()
    })
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-16">
      <h1 className="text-2xl font-semibold text-neutral-900">What&apos;s on your mind?</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Dump tasks, plans, and loose thoughts in one place. No structure required — we&apos;ll sort the
        basics for you.
      </p>
      <form action={formAction} className="mt-8 space-y-4">
        <div>
          <label htmlFor="brainDump" className="sr-only">
            Brain dump
          </label>
          <textarea
            id="brainDump"
            name="brainDump"
            rows={8}
            disabled={pending}
            placeholder="I need to do… and I need to go to… at 3pm"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
          />
        </div>
        {state.error ? (
          <p className="text-sm text-red-700" role="alert">
            {state.error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? 'Setting up…' : 'Continue'}
        </button>
      </form>
      <button
        type="button"
        disabled={pending}
        onClick={skip}
        className="mt-6 text-sm text-neutral-600 underline-offset-2 hover:underline"
      >
        Skip for now
      </button>
    </main>
  )
}
