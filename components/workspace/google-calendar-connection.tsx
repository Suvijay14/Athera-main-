'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'

import { Button } from '@/components/ctc/ui/Button'
import type { CalendarConnectionSummary } from '@/lib/db/calendar-connections'
import {
  disconnectGoogleCalendarAction,
  syncGoogleCalendarAction,
} from '@/app/workspace/calendar-integration-actions'
import { formatIsoDateTimeForDisplay } from '@/lib/workspace/format-item-datetime'

type GoogleCalendarConnectionProps = {
  spaceId: string
  connection: CalendarConnectionSummary | null
}

function formatSyncedAt(iso: string | null): string {
  if (!iso) {
    return 'Never synced'
  }
  return formatIsoDateTimeForDisplay(iso)
}

export function GoogleCalendarConnection({
  spaceId,
  connection,
}: GoogleCalendarConnectionProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [banner, setBanner] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const calendar = searchParams.get('calendar')
    const imported = searchParams.get('imported')
    const importErr = searchParams.get('import')
    const message = searchParams.get('message')

    if (calendar === 'connected') {
      if (importErr === 'error') {
        setError(
          message
            ? `Connected, but import failed: ${message}`
            : 'Connected, but calendar import failed. Try Sync now.'
        )
      } else if (imported != null) {
        setBanner(`Imported ${imported} events from Google Calendar.`)
      } else {
        setBanner('Connected to Google Calendar.')
      }
      router.replace(`/workspace/spaces/${spaceId}`, { scroll: false })
    } else if (calendar === 'error') {
      setError(message ? `Calendar connect failed: ${message}` : 'Calendar connect failed.')
      router.replace(`/workspace/spaces/${spaceId}`, { scroll: false })
    }
  }, [searchParams, spaceId, router])

  const connectHref = `/api/integrations/google-calendar/connect?spaceId=${encodeURIComponent(spaceId)}`

  function onSync() {
    setError(null)
    setBanner(null)
    startTransition(async () => {
      try {
        const result = await syncGoogleCalendarAction({ spaceId })
        setBanner(`Synced ${result.importedCount} events (${result.createdCount} new, ${result.updatedCount} updated).`)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Sync failed')
      }
    })
  }

  function onDisconnect() {
    setError(null)
    setBanner(null)
    startTransition(async () => {
      try {
        await disconnectGoogleCalendarAction({ spaceId })
        setBanner('Disconnected Google Calendar. Imported items stay in this space.')
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Disconnect failed')
      }
    })
  }

  return (
    <section
      className="mb-4 rounded-lg border border-neutral-200 bg-neutral-50/80 px-4 py-3"
      aria-label="Google Calendar integration"
    >
      {banner ? (
        <p className="mb-2 text-sm text-emerald-800" role="status">
          {banner}
        </p>
      ) : null}
      {error ? (
        <p className="mb-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {pending ? (
        <p className="mb-2 text-sm text-neutral-600" role="status">
          Importing your calendar…
        </p>
      ) : null}

      {connection ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-neutral-700">
            <span className="font-medium text-neutral-900">Connected to Google Calendar</span>
            <span className="mt-0.5 block text-neutral-600">
              Last synced: {formatSyncedAt(connection.lastSyncedAt)}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" disabled={pending} onClick={onSync}>
              Sync now
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={onDisconnect}
            >
              Disconnect
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-neutral-600">
            Import the last 4 weeks and next 4 weeks from Google Calendar into this space (read-only).
          </p>
          <Button type="button" variant="outline" size="sm" asChild>
            <a href={connectHref}>Connect Google Calendar</a>
          </Button>
        </div>
      )}
    </section>
  )
}
