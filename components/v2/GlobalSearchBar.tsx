'use client'

import { useState } from 'react'

import { dispatchOpenCommandBar } from '@/lib/workspace/open-command-bar'

export default function GlobalSearchBar() {
  const [query, setQuery] = useState('')

  return (
    <div className="flex-1 max-w-xl">
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-low border border-border-serenity focus-within:ring-2 focus-within:ring-primary-container/20">
        <span className="material-symbols-outlined text-[18px] text-secondary">search</span>
        <input
          id="athera-global-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => dispatchOpenCommandBar()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              dispatchOpenCommandBar()
            }
          }}
          placeholder="Ask Athera — opens command bar (⌘K)"
          className="flex-1 bg-transparent text-body-md text-on-surface placeholder:text-secondary outline-none min-w-0"
        />
        <kbd className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-secondary font-mono">
          ⌘K
        </kbd>
      </div>
    </div>
  )
}
