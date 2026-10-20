'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

import {
  completeOnboardingPersonaAction,
  skipOnboardingToWorkspaceAction,
} from '@/lib/onboarding/actions'
import type { OnboardingPersona } from '@/lib/onboarding/persona'
import { onboardingPersonaSchema } from '@/lib/onboarding/persona'

const OPTIONS: { id: OnboardingPersona; label: string; hint: string }[] = [
  { id: 'freelance', label: 'Freelance / studio', hint: 'Names your space “Clients”' },
  { id: 'tutoring', label: 'Tutoring & lessons', hint: 'Names your space “Tutoring”' },
  { id: 'startup', label: 'Building a startup', hint: 'Names your space “Company”' },
  { id: 'personal', label: 'Just me', hint: 'Keeps “My space”' },
]

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

  function choose(persona: OnboardingPersona) {
    startTransition(() => {
      void completeOnboardingPersonaAction({ persona })
    })
  }

  function skip() {
    startTransition(() => {
      void skipOnboardingToWorkspaceAction()
    })
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-16">
      <h1 className="text-2xl font-semibold text-neutral-900">What will you use Athera for?</h1>
      <p className="mt-2 text-sm text-neutral-600">
        This only sets your default space name. You can rename it anytime.
      </p>
      <ul className="mt-8 space-y-3">
        {OPTIONS.map((opt) => (
          <li key={opt.id}>
            <button
              type="button"
              disabled={pending}
              onClick={() => choose(opt.id)}
              className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-left hover:border-neutral-400 disabled:opacity-60"
            >
              <span className="font-medium text-neutral-900">{opt.label}</span>
              <span className="mt-0.5 block text-xs text-neutral-500">{opt.hint}</span>
            </button>
          </li>
        ))}
      </ul>
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
