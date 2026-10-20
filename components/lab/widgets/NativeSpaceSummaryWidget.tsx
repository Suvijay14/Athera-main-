'use client'

import { useEffect, useState } from 'react'

import SpaceSummaryGrid from '@/components/dashboard/SpaceSummaryGrid'

type NavSpace = { id: string; name: string; href: string }

export default function NativeSpaceSummaryWidget() {
  const [dynamicSpaces, setDynamicSpaces] = useState<
    { slug: string; name: string; href?: string }[]
  >([])

  useEffect(() => {
    fetch('/api/workspace/nav')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { spaces?: NavSpace[] } | null) => {
        const spaces = d?.spaces ?? []
        setDynamicSpaces(
          spaces.map((s) => ({
            slug: s.id,
            name: s.name,
            href: s.href,
          }))
        )
      })
      .catch(() => {})
  }, [])

  return <SpaceSummaryGrid tasks={[]} dynamicSpaces={dynamicSpaces} />
}
