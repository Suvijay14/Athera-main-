'use client'

import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from '@dnd-kit/core'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

import { dismissSuggestionAction } from '@/app/workspace/suggestion-actions'
import { acceptSplitSpaceSuggestionAction } from '@/app/workspace/split-suggestion-actions'
import { AdaptationToast, type ActiveAdaptationToast } from '@/components/adaptation/adaptation-toast'
import { Button } from '@/components/ctc/ui/Button'
import type { Operation } from '@/lib/adaptation/types'
import { parseSplitSuggestionOperations } from '@/lib/adaptation/split-space/parse-split-suggestion-operations'
import type { Suggestion } from '@/lib/db/schemas'

type SplitItem = { id: string; title: string }

type ClusterMeta = {
  name: string
  spaceId: string
}

function parseEvidence(evidence: Record<string, unknown>): {
  clusters: ClusterMeta[]
  splitItems: SplitItem[]
} {
  const clustersRaw = evidence.clusters
  const splitRaw = evidence.splitItems
  const clusters: ClusterMeta[] = Array.isArray(clustersRaw)
    ? clustersRaw
        .filter(
          (c): c is ClusterMeta =>
            typeof c === 'object' &&
            c !== null &&
            typeof (c as ClusterMeta).name === 'string' &&
            typeof (c as ClusterMeta).spaceId === 'string'
        )
        .map((c) => ({ name: c.name, spaceId: c.spaceId }))
    : []
  const splitItems: SplitItem[] = Array.isArray(splitRaw)
    ? splitRaw.filter(
        (i): i is SplitItem =>
          typeof i === 'object' &&
          i !== null &&
          typeof (i as SplitItem).id === 'string' &&
          typeof (i as SplitItem).title === 'string'
      )
    : []
  return { clusters, splitItems }
}

function DraggableSample({ id, title }: { id: string; title: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id })
  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined
  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`cursor-grab rounded border border-neutral-200 bg-white px-2 py-1 text-xs ${isDragging ? 'opacity-50' : ''}`}
      {...listeners}
      {...attributes}
    >
      {title}
    </li>
  )
}

function ClusterColumn({
  clusterId,
  name,
  items,
  count,
}: {
  clusterId: string
  name: string
  items: SplitItem[]
  count: number
}) {
  const { setNodeRef, isOver } = useDroppable({ id: clusterId })
  return (
    <div
      ref={setNodeRef}
      className={`flex-1 rounded-lg border p-3 ${isOver ? 'border-primary bg-primary/5' : 'border-neutral-200 bg-neutral-50'}`}
    >
      <h3 className="text-sm font-semibold text-neutral-900">{name}</h3>
      <p className="mt-1 text-xs text-neutral-500">{count} items</p>
      <ul className="mt-2 space-y-1">
        {items.map((item) => (
          <DraggableSample key={item.id} id={item.id} title={item.title} />
        ))}
      </ul>
    </div>
  )
}

function resolveTargetSpaceId(
  overId: string,
  clusterSpaceIds: Set<string>,
  assignments: Record<string, string>
): string | null {
  if (clusterSpaceIds.has(overId)) {
    return overId
  }
  const fromItem = assignments[overId]
  return fromItem ?? null
}

type SplitSpaceSuggestionCardProps = {
  suggestion: Suggestion
}

export function SplitSpaceSuggestionCard({ suggestion }: SplitSpaceSuggestionCardProps) {
  const router = useRouter()
  const { clusters, splitItems: evidenceItems } = useMemo(
    () => parseEvidence(suggestion.evidence),
    [suggestion.evidence]
  )

  const splitItems = useMemo(() => {
    if (evidenceItems.length > 0) {
      return evidenceItems
    }
    const { itemIds } = parseSplitSuggestionOperations(suggestion.operations as Operation[])
    const titleById = new Map<string, string>()
    const raw = suggestion.evidence.clusters
    if (Array.isArray(raw)) {
      for (const c of raw) {
        if (typeof c === 'object' && c !== null && Array.isArray((c as { sampleItems?: unknown }).sampleItems)) {
          for (const s of (c as { sampleItems: SplitItem[] }).sampleItems) {
            titleById.set(s.id, s.title)
          }
        }
      }
    }
    return itemIds.map((id) => ({ id, title: titleById.get(id) ?? 'Item' }))
  }, [evidenceItems, suggestion.evidence, suggestion.operations])

  const initialAssignments = useMemo(() => {
    const { initialAssignments: map } = parseSplitSuggestionOperations(
      suggestion.operations as Operation[]
    )
    const record: Record<string, string> = {}
    for (const [itemId, spaceId] of map.entries()) {
      record[itemId] = spaceId
    }
    return record
  }, [suggestion.operations])

  const itemsById = useMemo(() => {
    const m = new Map<string, SplitItem>()
    for (const item of splitItems) {
      m.set(item.id, item)
    }
    return m
  }, [splitItems])

  const clusterSpaceIds = useMemo(() => new Set(clusters.map((c) => c.spaceId)), [clusters])

  const [assignments, setAssignments] = useState(initialAssignments)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<ActiveAdaptationToast | null>(null)
  const [activeDrag, setActiveDrag] = useState<string | null>(null)

  const columns = useMemo(() => {
    return clusters.map((cluster) => {
      const inCluster = Object.entries(assignments)
        .filter(([, spaceId]) => spaceId === cluster.spaceId)
        .map(([itemId]) => itemsById.get(itemId) ?? { id: itemId, title: 'Item' })
      return {
        ...cluster,
        count: inCluster.length,
        samples: inCluster.slice(0, 3),
      }
    })
  }, [assignments, clusters, itemsById])

  function onDragEnd(event: DragEndEvent) {
    setActiveDrag(null)
    const { active, over } = event
    if (!over) {
      return
    }
    const itemId = String(active.id)
    const targetSpaceId = resolveTargetSpaceId(String(over.id), clusterSpaceIds, assignments)
    if (!targetSpaceId || assignments[itemId] === targetSpaceId) {
      return
    }
    setAssignments((prev) => ({ ...prev, [itemId]: targetSpaceId }))
  }

  async function accept() {
    setBusy(true)
    setError(null)
    const itemSpaceAssignments = Object.entries(assignments).map(([itemId, spaceId]) => ({
      itemId,
      spaceId,
    }))
    const result = await acceptSplitSpaceSuggestionAction({
      suggestionId: suggestion.id,
      itemSpaceAssignments,
    })
    setBusy(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    setToast({
      id: crypto.randomUUID(),
      summary: result.summary,
      changeLogId: result.changeLogId,
      status: 'visible',
    })
    router.push('/')
    router.refresh()
  }

  return (
    <>
      <div className="mb-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-neutral-800">{suggestion.reason}</p>
        <p className="mt-1 text-xs text-neutral-500">
          Drag samples between columns to correct assignments before accepting.
        </p>
        <DndContext
          onDragStart={(e) => setActiveDrag(String(e.active.id))}
          onDragEnd={onDragEnd}
        >
          <div className="mt-4 flex gap-3">
            {columns.map((c) => (
              <ClusterColumn
                key={c.spaceId}
                clusterId={c.spaceId}
                name={c.name}
                items={c.samples}
                count={c.count}
              />
            ))}
          </div>
          <DragOverlay>
            {activeDrag ? (
              <span className="rounded border bg-white px-2 py-1 text-xs shadow">Moving…</span>
            ) : null}
          </DragOverlay>
        </DndContext>
        <div className="mt-4 flex gap-2">
          <Button type="button" size="sm" disabled={busy} onClick={() => void accept()}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Split spaces'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => void dismissSuggestionAction(suggestion.id).then(() => router.refresh())}
          >
            Not now
          </Button>
        </div>
        {error ? (
          <p className="mt-2 text-xs text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      <AdaptationToast
        toast={toast}
        onClose={() => setToast(null)}
        onUpdate={(patch) => setToast((t) => (t ? { ...t, ...patch } : t))}
      />
    </>
  )
}
