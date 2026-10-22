'use client'

import { Suspense, useState } from 'react'

import { OpenItemFromQuery } from '@/components/workspace/open-item-from-query'

import { BoardView } from '@/components/workspace/board-view'
import { CalendarView } from '@/components/workspace/calendar/calendar-view'
import { FieldManager } from '@/components/workspace/field-manager'
import { GroupedView } from '@/components/workspace/grouped-view'
import { ArchiveSuggestionCard } from '@/components/adaptation/archive-suggestion-card'
import { RepeatedEntitySuggestionCard } from '@/components/adaptation/repeated-entity-suggestion-card'
import { SplitSpaceSuggestionCard } from '@/components/adaptation/split-space-suggestion-card'
import { SuggestionCard } from '@/components/adaptation/suggestion-card'
import { LearningIndicator } from '@/components/workspace/learning-indicator'
import { ItemDetailPanelHost } from '@/components/workspace/item-detail-panel'
import { QuickAdd } from '@/components/workspace/quick-add'
import { SidebarSpaceActions } from '@/components/workspace/app-sidebar'
import { ViewOpenedTracker } from '@/components/workspace/view-opened-tracker'
import { ViewTabs } from '@/components/workspace/view-tabs'
import { PasteWeekImportToast } from '@/components/workspace/paste-week-import-toast'
import { SpaceTaskList } from '@/components/workspace/space-task-list'
import { WorkspaceBreadcrumbSync } from '@/components/workspace/workspace-breadcrumb-sync'
import { WorkItemList } from '@/components/workspace/work-item-list'
import { Button } from '@/components/ctc/ui/Button'
import type { ChangeLogListItem } from '@/lib/db/change-log'
import type { CalendarConnectionSummary } from '@/lib/db/calendar-connections'
import type {
  Entity,
  FieldDefinition,
  RecurrenceRule,
  Space,
  Suggestion,
  ViewDefinition,
  Workspace,
} from '@/lib/db/schemas'
import { GoogleCalendarConnection } from '@/components/workspace/google-calendar-connection'
import type { DisplayWorkItem } from '@/lib/workspace/merge-recurrence-display-items'
import { spaceIconComponent } from '@/lib/workspace/space-icons'

type WorkspaceContentProps = {
  workspace: Workspace
  fields: FieldDefinition[]
  items: DisplayWorkItem[]
  recurrenceRules?: RecurrenceRule[]
  spaces: Space[]
  currentSpace: Space
  entities: Entity[]
  defaultSpace: Space
  views: ViewDefinition[]
  activeViewId: string | null
  userEmail?: string
  pendingSuggestion: Suggestion | null
  activeAdaptationCount: number
  activeChanges: ChangeLogListItem[]
  calendarConnection?: CalendarConnectionSummary | null
}

function ViewBody({
  activeViewId,
  views,
  items,
  fields,
  itemLabel,
  entities,
  currentSpace,
}: {
  activeViewId: string | null
  views: ViewDefinition[]
  items: DisplayWorkItem[]
  recurrenceRules?: RecurrenceRule[]
  fields: FieldDefinition[]
  itemLabel: string
  entities: Entity[]
  currentSpace: Space
}) {
  if (!activeViewId) {
    return (
      <SpaceTaskList
        items={items}
        fields={fields}
        entities={entities}
        space={currentSpace}
        itemLabel={itemLabel}
      />
    )
  }

  const view = views.find((v) => v.id === activeViewId)
  if (!view) {
    return (
      <p className="text-sm text-red-600" role="alert">
        View not found.
      </p>
    )
  }

  if (view.type === 'list') {
    return (
      <SpaceTaskList
        items={items}
        fields={fields}
        entities={entities}
        space={currentSpace}
        itemLabel={itemLabel}
      />
    )
  }

  if (view.type === 'grouped' && view.groupByField) {
    return (
      <Suspense
        fallback={
          <WorkItemList items={[]} fields={fields} itemLabel={itemLabel} loading />
        }
      >
        <GroupedView
          items={items}
          fields={fields}
          entities={entities}
          groupByField={view.groupByField}
          itemLabel={itemLabel}
          viewId={view.id}
        />
      </Suspense>
    )
  }

  if (view.type === 'calendar') {
    return (
      <CalendarView
        view={view}
        views={views}
        items={items}
        fields={fields}
        entities={entities}
      />
    )
  }

  if (view.type === 'board' && view.groupByField) {
    const field = fields.find((f) => f.key === view.groupByField)
    if (!field) {
      return (
        <p className="text-sm text-neutral-600">
          This board is grouped by a field that no longer exists.
        </p>
      )
    }
    return <BoardView items={items} groupByField={field} />
  }

  return (
    <p className="text-sm text-neutral-600">This view is not configured yet.</p>
  )
}

export function WorkspaceContent({
  workspace,
  fields,
  items,
  spaces,
  currentSpace,
  entities,
  defaultSpace,
  views,
  activeViewId,
  pendingSuggestion,
  activeAdaptationCount,
  activeChanges,
  recurrenceRules = [],
  calendarConnection = null,
}: WorkspaceContentProps) {
  const [managerOpen, setManagerOpen] = useState(false)
  const itemLabel = workspace.itemLabel
  const activeView = activeViewId ? views.find((v) => v.id === activeViewId) : undefined
  const SpaceIcon = spaceIconComponent(currentSpace.icon)
  const showPatternSubhead = items.length > 0 && activeAdaptationCount === 0

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-8 md:px-10">
      <WorkspaceBreadcrumbSync spaceName={currentSpace.name} activeView={activeView ?? null} />
      <PasteWeekImportToast />
      <Suspense fallback={null}>
        <OpenItemFromQuery />
      </Suspense>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span
            className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg"
            style={{
              backgroundColor: `${currentSpace.color ?? '#6366f1'}22`,
              color: currentSpace.color ?? '#6366f1',
            }}
          >
            <SpaceIcon size={20} aria-hidden />
          </span>
          <div>
            <h1 className="font-newsreader text-[1.75rem] font-medium text-ink-primary">{currentSpace.name}</h1>
            {showPatternSubhead ? (
              <p className="mt-1 text-sm text-ink-muted">
                Everything you have added. Athera is watching for patterns.
              </p>
            ) : (
              <p className="mt-1 text-sm text-ink-muted">{workspace.name}</p>
            )}
            <SidebarSpaceActions space={currentSpace} />
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setManagerOpen(true)}>
          Manage fields
        </Button>
      </header>

      <Suspense fallback={null}>
        <GoogleCalendarConnection spaceId={currentSpace.id} connection={calendarConnection} />
      </Suspense>

      {!showPatternSubhead ? (
        <LearningIndicator
          itemCount={items.length}
          activeAdaptationCount={activeAdaptationCount}
          activeChanges={activeChanges}
        />
      ) : null}
      {pendingSuggestion?.type === 'archive-entities' ? (
        <ArchiveSuggestionCard suggestion={pendingSuggestion} />
      ) : pendingSuggestion?.type === 'split_space' ? (
        <SplitSpaceSuggestionCard suggestion={pendingSuggestion} />
      ) : pendingSuggestion?.type === 'repeated-entity' ? (
        <RepeatedEntitySuggestionCard suggestion={pendingSuggestion} />
      ) : (
        <SuggestionCard suggestion={pendingSuggestion} />
      )}
      <QuickAdd
        itemLabel={itemLabel}
        spaceResolution={{ fromSpaceView: true, contextSpaceId: currentSpace.id }}
        autoFocus={items.length === 0}
        rotatingPlaceholder={items.length === 0}
      />
      <ViewTabs spaceId={currentSpace.id} views={views} />
      {activeView ? <ViewOpenedTracker view={activeView} /> : null}
      <div className="flex min-h-0 items-stretch gap-0">
        <div className="min-w-0 flex-1">
          <ViewBody
            activeViewId={activeViewId}
            views={views}
            items={items}
            fields={fields}
            itemLabel={itemLabel}
            entities={entities}
            currentSpace={currentSpace}
          />
        </div>
        <ItemDetailPanelHost
          items={items}
          fields={fields}
          entities={entities}
          spaces={spaces}
          defaultSpace={defaultSpace}
          itemLabel={itemLabel}
          recurrenceRules={recurrenceRules}
        />
      </div>

      <FieldManager
        open={managerOpen}
        onClose={() => setManagerOpen(false)}
        fields={fields}
        views={views}
      />
    </main>
  )
}
