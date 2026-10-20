'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'

import { requestAccountDeletionAction } from '@/app/workspace/account-actions'
import { Button } from '@/components/ctc/ui/Button'
import type { BillingPlan, SubscriptionStatus } from '@/lib/billing/plans'
import { PLAN_LABELS, PLAN_PRICING_COPY } from '@/lib/billing/plans'

type AccountSettingsProps = {
  plan: BillingPlan
  subscriptionStatus: SubscriptionStatus
  hasStripeCustomer: boolean
}

export function AccountSettings({ plan, subscriptionStatus, hasStripeCustomer }: AccountSettingsProps) {
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const checkout = searchParams.get('checkout')

  async function startCheckout(selected: 'personal' | 'business') {
    setError(null)
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: selected }),
    })
    const data = (await res.json()) as { url?: string; error?: string }
    if (!res.ok || !data.url) {
      setError(data.error ?? 'Could not start checkout')
      return
    }
    window.location.href = data.url
  }

  async function openPortal() {
    setError(null)
    const res = await fetch('/api/billing/portal', { method: 'POST' })
    const data = (await res.json()) as { url?: string; error?: string }
    if (!res.ok || !data.url) {
      setError(data.error ?? 'Could not open billing portal')
      return
    }
    window.location.href = data.url
  }

  function downloadExport(kind: 'csv' | 'json') {
    window.location.href = `/api/workspace/export?format=${kind}`
  }

  function submitDelete() {
    setError(null)
    startTransition(async () => {
      const result = await requestAccountDeletionAction({ confirmation: deleteConfirm as 'DELETE' })
      if (result && 'ok' in result && result.ok === false) {
        setError(result.error)
      }
    })
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-neutral-900">Account settings</h1>
        <p className="mt-1 text-sm text-neutral-600">Billing, export, and account lifecycle.</p>
      </header>

      {checkout === 'success' ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">
          Subscription updated. It may take a moment to reflect here.
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <section className="rounded-lg border border-neutral-200 p-5">
        <h2 className="text-lg font-medium text-neutral-900">Plan</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Current: <strong>{PLAN_LABELS[plan]}</strong> ({subscriptionStatus})
        </p>
        <ul className="mt-3 space-y-1 text-xs text-neutral-600">
          {(Object.keys(PLAN_PRICING_COPY) as BillingPlan[]).map((p) => (
            <li key={p}>{PLAN_PRICING_COPY[p]}</li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-neutral-500">
          Business tier is available for purchase; per-seat team features are not built yet (P1).
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" size="sm" disabled={pending} onClick={() => startCheckout('personal')}>
            Upgrade to Personal
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => startCheckout('business')}>
            Upgrade to Business
          </Button>
          {hasStripeCustomer ? (
            <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={openPortal}>
              Manage billing
            </Button>
          ) : null}
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 p-5">
        <h2 className="text-lg font-medium text-neutral-900">Export data</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Download all work items as CSV, or a full workspace backup as JSON (spaces, fields, entities, views, notes, drafts).
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => downloadExport('csv')}>
            Export CSV
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => downloadExport('json')}>
            Export JSON
          </Button>
        </div>
      </section>

      <section className="rounded-lg border border-red-200 bg-red-50/50 p-5">
        <h2 className="text-lg font-medium text-red-900">Delete account</h2>
        <p className="mt-1 text-sm text-red-800">
          Marks your workspace for deletion. Data is scheduled for removal within 30 days. Automated purge after 30 days is not built yet — this sets <code className="text-xs">deleted_at</code> and signs you out.
        </p>
        <label className="mt-4 block text-sm text-neutral-800">
          Type <strong>DELETE</strong> to confirm
          <input
            type="text"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            autoComplete="off"
          />
        </label>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="mt-3"
          disabled={pending || deleteConfirm !== 'DELETE'}
          onClick={submitDelete}
        >
          Delete my account
        </Button>
      </section>

      <p className="text-sm text-neutral-600">
        <Link href="/privacy" className="text-primary underline-offset-2 hover:underline">
          Privacy & data use
        </Link>
      </p>
    </div>
  )
}
