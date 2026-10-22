'use client'

import { createContext, useContext, useMemo, useState } from 'react'
import {
  DEFAULT_PERSONA,
  PERSONA_PACKS,
  type LandingPersona,
  type PersonaPack,
} from '@/lib/landing/persona-content'
import { trackLandingEvent } from '@/lib/landing/analytics'

type SetPersonaOptions = {
  track?: boolean
  /** When false, keep pack default but do not mark an explicit user choice (e.g. Not now). */
  explicit?: boolean
  /** When true, update pack only — do not change personaExplicit (hero-driven sync). */
  syncOnly?: boolean
}

type LandingPersonaContextValue = {
  persona: LandingPersona
  pack: PersonaPack
  /** User picked a persona from the prompt (not "Not now"). */
  personaExplicit: boolean
  heroExampleId: LandingPersona
  setHeroExampleId: (id: LandingPersona) => void
  setPersona: (persona: LandingPersona, options?: SetPersonaOptions) => void
}

const LandingPersonaContext = createContext<LandingPersonaContextValue | null>(null)

export function LandingPersonaProvider({ children }: { children: React.ReactNode }) {
  const [persona, setPersonaState] = useState<LandingPersona>(DEFAULT_PERSONA)
  const [personaExplicit, setPersonaExplicit] = useState(false)
  const [heroExampleId, setHeroExampleId] = useState<LandingPersona>(DEFAULT_PERSONA)

  const setPersona = (next: LandingPersona, options?: SetPersonaOptions) => {
    setPersonaState(next)
    setHeroExampleId(next)
    if (!options?.syncOnly) {
      if (options?.explicit === false) {
        setPersonaExplicit(false)
      } else {
        setPersonaExplicit(true)
      }
    }
    if (options?.track !== false) {
      trackLandingEvent('persona_selected', { persona: next })
    }
  }

  const value = useMemo(
    () => ({
      persona,
      pack: PERSONA_PACKS[persona],
      personaExplicit,
      heroExampleId,
      setHeroExampleId,
      setPersona,
    }),
    [persona, personaExplicit, heroExampleId]
  )

  return (
    <LandingPersonaContext.Provider value={value}>{children}</LandingPersonaContext.Provider>
  )
}

export function useLandingPersona() {
  const ctx = useContext(LandingPersonaContext)
  if (!ctx) {
    throw new Error('useLandingPersona must be used within LandingPersonaProvider')
  }
  return ctx
}
