'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'

import { getDefaultSpaceId, updateSpace } from '@/lib/db/spaces'
import { updateWorkspace } from '@/lib/db/workspaces'
import { track } from '@/lib/events'
import {
  defaultSpaceNameForPersona,
  ONBOARDING_V1_COMPLETE_KEY,
  onboardingPersonaSchema,
  type OnboardingPersona,
} from '@/lib/onboarding/persona'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/supabase/get-current-workspace'

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

  redirect('/')
}

export async function skipOnboardingToWorkspaceAction(): Promise<void> {
  await completeOnboardingPersonaAction({ skipped: true })
}
