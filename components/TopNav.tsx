'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { checkAgentHealth, isLlmReady, llmStatusLabel } from '@/lib/agent'
import { SpaceDropZone } from '@/components/FileApprovalWidget'

const staticTabs = [
  { label: 'School', href: '/' },
  { label: 'Work', href: '/work' },
  { label: 'Personal', href: '/personal' },
]

interface DynamicSpace {
  slug: string
  name: string
}

export default function TopNav() {
  const pathname = usePathname()
  const [apiOnline, setApiOnline] = useState(false)
  const [aiLabel, setAiLabel] = useState('AI offline')
  const [dynamicSpaces, setDynamicSpaces] = useState<DynamicSpace[]>([])

  useEffect(() => {
    const sync = (h: Awaited<ReturnType<typeof checkAgentHealth>>) => {
      setApiOnline(isLlmReady(h))
      setAiLabel(isLlmReady(h) ? llmStatusLabel(h) : 'AI offline')
    }
    checkAgentHealth().then(sync)
    const interval = setInterval(() => checkAgentHealth().then(sync), 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const fetchSpaces = () => {
      fetch('/api/spaces')
        .then((res) => res.json())
        .then((data: { spaces: DynamicSpace[] }) => setDynamicSpaces(data.spaces))
        .catch(() => {})
    }
    fetchSpaces()
    const interval = setInterval(fetchSpaces, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="bg-surface-vellum border-b border-border-delicate px-6 py-3 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-1 bg-surface-container rounded-full px-1 py-1">
        <div className="flex items-center gap-0.5 mr-1 pl-1">
          <div className="w-3 h-3 bg-terracotta rounded-full opacity-80" />
        </div>
        {staticTabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`space-pill ${
              pathname === tab.href ? 'space-pill-active' : 'space-pill-inactive'
            }`}
          >
            {tab.label}
          </Link>
        ))}
        {dynamicSpaces.map((space) => {
          const href = `/spaces/${space.slug}`
          return (
            <SpaceDropZone key={space.slug} slug={space.slug} name={space.name}>
              <Link
                href={href}
                className={`space-pill ${
                  pathname === href ? 'space-pill-active' : 'space-pill-inactive'
                }`}
              >
                {space.name}
              </Link>
            </SpaceDropZone>
          )
        })}
      </div>

      <div
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
          apiOnline ? 'bg-sage-light' : 'bg-surface-container'
        }`}
      >
        <div
          className={`w-1.5 h-1.5 rounded-full ${
            apiOnline ? 'bg-sage animate-pulse' : 'bg-ink-faint'
          }`}
        />
        <span className={`text-xs font-medium ${apiOnline ? 'text-sage' : 'text-ink-faint'}`}>
          {apiOnline ? aiLabel : 'AI offline'}
        </span>
      </div>
    </header>
  )
}
