'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

import {
  archiveSelectedEntitiesAction,
  excludeEntityFromArchiveAction,
  followUpSelectedEntitiesAction,
} from '@/app/workspace/archive-suggestion-actions'
import { dismissSuggestionAction } from '@/app/workspace/suggestion-actions'
import { AdaptationToast, type ActiveAdaptationToast } from '@/components/adaptation/adaptation-toast'
import { Button } from '@/components/ctc/ui/Button'
import type { Suggestion } from '@/lib/db/schemas'

type ArchiveEntityEvidence = {
  id: string
  name: string
  kind: string
}

function parseEntities(evidence: Record<string, unknown>): ArchiveEntityEvidence[] {
  const raw = evidence.entities
  if (!Array.isArray(raw)) {
    return []
  }
  return raw.filter(
    (e): e is ArchiveEntityEvidence =>
      typeof e === 'object' &&
      e !== null &&
      typeof (e as ArchiveEntityEvidence).id === 'string' &&
      typeof (e as ArchiveEntityEvidence).name === 'string'
  )
}

type ArchiveSuggestionCardProps = {
  suggestion: Suggestion
}

export function ArchiveSuggestionCard({ suggestion }: ArchiveSuggestionCardProps) {
  const router = useRouter()
  const entities = useMemo(() => parseEntities(suggestion.evidence), [suggestion.evidence])
  const [selected, setSelected] = useState<Set<string>>(() => new Set(entities.map((e) => e.id)))
  const [busy, setBusy] = useState<'archive' | 'follow' | 'dismiss' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<{ body: string; entityName: string } | null>(null)
  const [toast, setToast] = useState<ActiveAdaptationToast | null>(null)

  const selectedIds = [...selected]

  async function handleArchive() {
    setBusy('archive')
    setError(null)
    const result = await archiveSelectedEntitiesAction({
      suggestionId: suggestion.id,
      entityIds: selectedIds,
    })
    setBusy(null)
    if (!result.ok) {
      setError(result.message)
      return
    }
    if (result.changeLogId && result.toastSummary) {
      setToast({
        id: crypto.randomUUID(),
        summary: result.toastSummary,
        changeLogId: result.changeLogId,
        status: 'visible',
      })
    }
    router.refresh()
  }

  async function handleFollowUp() {
    setBusy('follow')
    setError(null)
    const result = await followUpSelectedEntitiesAction({
      suggestionId: suggestion.id,
      entityIds: selectedIds,
    })
    setBusy(null)
    if (!result.ok) {
      setError(result.message)
      return
    }
    if (result.draft) {
      setDraft({ body: result.draft.body, entityName: result.draft.entityName })
    }
    if (result.changeLogId && result.toastSummary) {
      setToast({
        id: crypto.randomUUID(),
        summary: result.toastSummary,
        changeLogId: result.changeLogId,
        status: 'visible',
      })
    }
    router.refresh()
  }

  async function handleDismiss() {
    setBusy('dismiss')
    setError(null)
    await dismissSuggestionAction(suggestion.id)
    setBusy(null)
    router.refresh()
  }

  function copyDraft() {
    if (!draft) {
      return
    }
    void navigator.clipboard.writeText(draft.body)
  }

  function mailtoDraft() {
    if (!draft) {
      return
    }
    const url = `mailto:?body=${encodeURIComponent(draft.body)}`
    window.open(url, '_blank')
  }

  return (
    <>
    <AdaptationToast
      toast={toast}
      onClose={() => setToast(null)}
      onUpdate={(patch) => setToast((t) => (t ? { ...t, ...patch } : t))}
    />
    <section
      className="mb-4 rounded-xl border border-border-serenity bg-surface-container-low p-4 shadow-sm"
      aria-label="Archive suggestion"
    >
      <p className="text-sm text-on-surface">{suggestion.reason}</p>
      <ul className="mt-3 space-y-2">
        {entities.map((ent) => (
          <li key={ent.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selected.has(ent.id)}
              onChange={(e) => {
                setSelected((prev) => {
                  const next = new Set(prev)
                  if (e.target.checked) {
                    next.add(ent.id)
                  } else {
                    next.delete(ent.id)
                  }
                  return next
                })
              }}
            />
            <span>{ent.name}</span>
            <button
              type="button"
              className="ml-auto text-xs text-neutral-500 underline"
              onClick={() => void excludeEntityFromArchiveAction(ent.id).then(() => router.refresh())}
            >
              Don&apos;t ask about {ent.name} again
            </button>
          </li>
        ))}
      </ul>
      {error ? (
        <p className="mt-2 text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}
      {draft ? (
        <div className="mt-3 rounded-lg border border-neutral-200 bg-white p-3 text-sm">
          <p className="font-medium text-neutral-800">Draft check-in for {draft.entityName}</p>
          <p className="mt-2 whitespace-pre-wrap text-neutral-700">{draft.body}</p>
          <div className="mt-2 flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={copyDraft}>
              Copy
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={mailtoDraft}>
              Open in email
            </Button>
          </div>
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={busy !== null || selectedIds.length === 0} onClick={() => void handleArchive()}>
          {busy === 'archive' ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Archive selected'}
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={busy !== null || selectedIds.length === 0} onClick={() => void handleFollowUp()}>
          {busy === 'follow' ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Remind me to follow up'}
        </Button>
        <Button type="button" size="sm" variant="ghost" disabled={busy !== null} onClick={() => void handleDismiss()}>
          {busy === 'dismiss' ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Not now'}
        </Button>
      </div>
    </section>
    </>
  )
}
