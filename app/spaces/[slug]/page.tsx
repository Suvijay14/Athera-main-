'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import SpacePage from '@/components/SpacePage'

interface Space {
  slug: string
  name: string
}

export default function DynamicSpacePage() {
  const params = useParams()
  const slug = params.slug as string
  const [space, setSpace] = useState<Space | null>(null)

  useEffect(() => {
    fetch('/api/spaces')
      .then((res) => res.json())
      .then((data: { spaces: Space[] }) => {
        const match = data.spaces.find((s) => s.slug === slug)
        setSpace(match ?? { slug, name: slug.replace(/-/g, ' ') })
      })
      .catch(() => setSpace({ slug, name: slug.replace(/-/g, ' ') }))
  }, [slug])

  if (!space) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 bg-surface-container rounded animate-pulse" />
      </div>
    )
  }

  return <SpacePage space={space.slug} label={space.name} showFilesWidget />
}
