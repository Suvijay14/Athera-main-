'use server'

import { redirect } from 'next/navigation'

import { resolvePostAuthPath } from '@/lib/auth/post-auth-path'
import { signInInputSchema, signUpInputSchema } from '@/lib/db/schemas'
import { getWorkspaceForUser } from '@/lib/db/workspaces'
import { createClient } from '@/lib/supabase/server'

export type AuthActionState = {
  error?: string
}

export async function signUpAction(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = signUpInputSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const client = await createClient()
  const { data, error } = await client.auth.signUp(parsed.data)

  if (error) {
    return { error: error.message }
  }

  if (!data.session) {
    return {
      error:
        'Account created. Check your email to confirm your address, then sign in.',
    }
  }

  redirect('/onboarding')
}

export async function signInAction(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = signInInputSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const client = await createClient()
  const { data: signInData, error } = await client.auth.signInWithPassword(parsed.data)

  if (error) {
    return { error: error.message }
  }

  const next = formData.get('next')
  if (typeof next === 'string' && next.startsWith('/') && !next.startsWith('//')) {
    redirect(next)
  }

  const userId = signInData.user?.id
  if (!userId) {
    redirect('/login')
  }

  const workspace = await getWorkspaceForUser(client, userId)
  const answers = workspace?.onboardingAnswers ?? {}
  redirect(resolvePostAuthPath(answers))
}

export async function signOutAction(): Promise<void> {
  const client = await createClient()
  await client.auth.signOut()
  redirect('/')
}
