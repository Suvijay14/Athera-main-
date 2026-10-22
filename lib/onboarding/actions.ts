'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'

import { getDefaultSpaceId, updateSpace } from '@/lib/db/spaces'
import { updateWorkspace } from '@/lib/db/workspaces'
import { track } from '@/lib/events'
import { applyBrainDump } from '@/lib/onboarding/apply-brain-dump'
import {
  defaultSpaceNameForPersona,
  ONBOARDING_V1_COMPLETE_KEY,
  onboardingPersonaSchema,
  type OnboardingPersona,
} from '@/lib/onboarding/persona'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/supabase/get-current-workspace'
import { PRODUCT_ENTRY_PATH } from '@/lib/routes/product-entry'

const completeSchema = z.object({
  persona: onboardingPersonaSchema.optional(),
  skipped: z.boolean().optional(),
})

export async function completeOnboardingPersonaAction(
  raw: z.infer<typeof completeSchema>
): Promise<void> {
  const parsed = completeSchema.parse(raw)
  const { workspace, user } = await getCurrentWorkspace()
  const client = await createClient()

  const persona: OnboardingPersona = parsed.skipped
    ? 'personal'
    : (parsed.persona ?? 'personal')

  const defaultSpaceId = await getDefaultSpaceId(client, workspace.id)
  const spaceName = defaultSpaceNameForPersona(persona)
  await updateSpace(client, workspace.id, defaultSpaceId, { name: spaceName })

  const answers = {
    ...workspace.onboardingAnswers,
    persona,
    [ONBOARDING_V1_COMPLETE_KEY]: true,
  }
  await updateWorkspace(client, workspace.id, { onboardingAnswers: answers })

  if (!parsed.skipped) {
    await track(client, {
      workspaceId: workspace.id,
      userId: user.id,
      name: 'persona_selected',
      props: { persona },
    })
  }

  await track(client, {
    workspaceId: workspace.id,
    userId: user.id,
    name: 'onboarding_completed',
    props: { persona, skipped: parsed.skipped ?? false },
  })

  redirect(PRODUCT_ENTRY_PATH)
}

export async function skipOnboardingToWorkspaceAction(): Promise<void> {
  await completeOnboardingPersonaAction({ skipped: true })
}

const brainDumpSchema = z.object({
  text: z.string().trim().min(1, 'Write a few words to continue'),
})

export type BrainDumpActionState = {
  error?: string
}

export async function completeBrainDumpOnboardingAction(
  _prev: BrainDumpActionState,
  formData: FormData
): Promise<BrainDumpActionState> {
  const parsed = brainDumpSchema.safeParse({ text: formData.get('brainDump') })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const { workspace, user } = await getCurrentWorkspace()
  const client = await createClient()

  await applyBrainDump(client, workspace.id, user.id, parsed.data.text)

  const answers = {
    ...workspace.onboardingAnswers,
    persona: 'personal' as OnboardingPersona,
    brain_dump_completed: true,
    [ONBOARDING_V1_COMPLETE_KEY]: true,
  }
  await updateWorkspace(client, workspace.id, { onboardingAnswers: answers })

  await track(client, {
    workspaceId: workspace.id,
    userId: user.id,
    name: 'onboarding_completed',
    props: { skipped: false, brain_dump: true },
  })

  redirect(PRODUCT_ENTRY_PATH)
}
