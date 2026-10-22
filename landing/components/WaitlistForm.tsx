'use client'

import { FormEvent, useState } from 'react'
import clsx from 'clsx'
import { trackLandingEvent } from '@/lib/landing/analytics'

type WaitlistFormProps = {
  source: string
  layout?: 'inline' | 'stacked'
  size?: 'default' | 'hero'
  className?: string
  inputId?: string
  submitLabel?: string
}

export default function WaitlistForm({
  source,
  layout = 'inline',
  size = 'default',
  className,
  inputId = 'waitlist-email',
  submitLabel = 'Get early access',
}: WaitlistFormProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('loading')
    setMessage('')

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string; duplicate?: boolean }

      if (!res.ok) {
        setStatus('error')
        setMessage(data.error ?? 'Something went wrong. Try again.')
        return
      }

      setStatus('success')
      setMessage(
        data.duplicate
          ? "You're already on the list. We'll email you soon."
          : "You're in! We'll email you when early access opens."
      )
      trackLandingEvent('waitlist_signup', { source })
    } catch {
      setStatus('error')
      setMessage('Could not connect. Try again in a moment.')
    }
  }

  if (status === 'success') {
    return (
      <div
        className={clsx(
          'rounded-lg border border-sage/30 bg-sage-light px-4 py-3 text-sm text-sage',
          className
        )}
        role="status"
      >
        {message}
      </div>
    )
  }

  const isInline = layout === 'inline'
  const isHero = size === 'hero'

  return (
    <form
      onSubmit={onSubmit}
      className={clsx(
        isInline ? 'flex flex-col gap-2 w-full' : 'space-y-3 w-full max-w-md',
        isHero ? 'max-w-[520px]' : isInline ? 'max-w-xl' : '',
        className
      )}
    >
      <div className={clsx(isInline && 'flex flex-col sm:flex-row gap-2 w-full')}>
        <label htmlFor={inputId} className="sr-only">
          Email address
        </label>
        <input
          id={inputId}
          type="email"
          name="email"
          autoComplete="email"
          required
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === 'loading'}
          className={clsx(
            'flex-1 min-w-0 rounded-md border border-border-delicate bg-surface-paper text-ink-primary placeholder:text-ink-faint',
            'focus:outline-none focus:ring-2 focus:ring-sage/40 focus:border-sage/50',
            isHero ? 'h-14 px-4 text-[17px]' : 'px-4 py-3 text-sm'
          )}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className={clsx(
            'shrink-0 rounded-md bg-sage font-semibold text-white hover:bg-[#435a41] transition-colors disabled:opacity-60',
            isHero ? 'h-14 px-5 text-[17px]' : 'px-5 py-3 text-sm',
            !isInline && 'w-full'
          )}
        >
          {status === 'loading' ? 'Sending…' : submitLabel}
        </button>
      </div>
      {status === 'error' && message ? (
        <p className="text-sm text-terracotta">{message}</p>
      ) : null}
    </form>
  )
}
