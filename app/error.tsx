'use client'

import { useEffect } from 'react'

function isChunkLoadError(error: Error): boolean {
  if (error.name === 'ChunkLoadError') {
    return true
  }
  return /loading chunk .* failed/i.test(error.message)
}

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (!isChunkLoadError(error)) {
      return
    }
    const key = 'athera-chunk-reload'
    if (sessionStorage.getItem(key)) {
      sessionStorage.removeItem(key)
      return
    }
    sessionStorage.setItem(key, '1')
    window.location.reload()
  }, [error])

  const staleBundle = isChunkLoadError(error)

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12 text-center">
      <h1 className="text-xl font-semibold text-neutral-900">
        {staleBundle ? 'Updating the app…' : 'Something went wrong'}
      </h1>
      <p className="mt-3 text-sm text-neutral-600">
        {staleBundle
          ? 'Your browser had an old copy of the app. Reloading should fix it.'
          : 'Try again. If this keeps happening, refresh the page.'}
      </p>
      {!staleBundle ? (
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white"
        >
          Try again
        </button>
      ) : null}
    </main>
  )
}
