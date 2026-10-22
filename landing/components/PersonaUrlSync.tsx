'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { parsePersonaParam } from '@/demo-data'
import { useLandingPersona } from '@/components/landing/LandingPersonaContext'

export default function PersonaUrlSync() {
  const searchParams = useSearchParams()
  const { setPersona } = useLandingPersona()

  useEffect(() => {
    const parsed = parsePersonaParam(searchParams.get('persona'))
    if (parsed) {
      setPersona(parsed, { track: false })
    }
  }, [searchParams, setPersona])

  return null
}
