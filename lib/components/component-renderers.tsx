'use client'

import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

import PlannedPortPlaceholder from '@/components/lab/PlannedPortPlaceholder'
import { getComponentMeta } from './registry-meta'
import type { ComponentId } from './types'

const NativeCompactAssistant = dynamic(
  () => import('@/components/lab/widgets/NativeCompactAssistantWidget'),
  { loading: () => <WidgetSkeleton /> }
)
const NativeAtherasNote = dynamic(
  () => import('@/components/lab/widgets/NativeAtherasNoteWidget'),
  { loading: () => <WidgetSkeleton /> }
)
const NativeUpcomingEvents = dynamic(
  () => import('@/components/lab/widgets/NativeUpcomingEventsWidget'),
  { loading: () => <WidgetSkeleton /> }
)
const NativeSpaceSummary = dynamic(
  () => import('@/components/lab/widgets/NativeSpaceSummaryWidget'),
  { loading: () => <WidgetSkeleton /> }
)
const NativeBCourses = dynamic(
  () => import('@/components/lab/widgets/NativeBCoursesWidget'),
  { loading: () => <WidgetSkeleton /> }
)
const CtcUiKitDemo = dynamic(() => import('@/components/ctc/demos/UiKitDemo'))
const CtcEmptyStateDemo = dynamic(() => import('@/components/ctc/demos/EmptyStateDemo'))
const CtcToastDemo = dynamic(() => import('@/components/ctc/demos/ToastDemo'))
const CtcCommandPaletteLab = dynamic(() => import('@/components/ctc/tools/CommandPaletteLab'))
const CtcPageTransitionDemo = dynamic(() => import('@/components/ctc/ui/PageTransitionDemo'))
const CtcNewTaskModalLab = dynamic(() => import('@/components/ctc/tasks/NewTaskModalLab'))
const CtcTaskSwipeDemoLab = dynamic(() => import('@/components/ctc/tasks/TaskSwipeDemoLab'))
const CtcSmartNoteInputLab = dynamic(() => import('@/components/ctc/notes/SmartNoteInputLab'))
const CtcDocLibraryLab = dynamic(() => import('@/components/ctc/documents/DocumentLibraryLab'))
const CtcImportCardLab = dynamic(() => import('@/components/ctc/documents/ImportCardLab'))
const CtcBriefImportLab = dynamic(() => import('@/components/ctc/documents/BriefImportLab'))

function WidgetSkeleton() {
  return <div className="h-32 animate-pulse rounded-xl bg-surface-container" aria-busy />
}

export type DashboardWidgetProps = {
  space?: string
}

const LIVE_RENDERERS: Partial<Record<ComponentId, ComponentType<DashboardWidgetProps>>> = {
  'native-compact-assistant': NativeCompactAssistant,
  'native-atheras-note': NativeAtherasNote,
  'native-upcoming-events': NativeUpcomingEvents,
  'native-space-summary': NativeSpaceSummary,
  'native-bcourses': NativeBCourses,
  'ctc-ui-kit-demo': CtcUiKitDemo,
  'ctc-empty-state-demo': CtcEmptyStateDemo,
  'ctc-toast-demo': CtcToastDemo,
  'ctc-command-palette-page': CtcCommandPaletteLab,
  'ctc-command-palette': CtcCommandPaletteLab,
  'ctc-ui-page-transition': CtcPageTransitionDemo,
  'ctc-tasks-new-modal': CtcNewTaskModalLab,
  'ctc-tasks-swipe-row': CtcTaskSwipeDemoLab,
  'ctc-smart-note-input': CtcSmartNoteInputLab,
  'ctc-doc-library': CtcDocLibraryLab,
  'ctc-doc-import-card': CtcImportCardLab,
  'ctc-doc-brief-import': CtcBriefImportLab,
}

export function renderComponent(id: ComponentId, props?: DashboardWidgetProps) {
  const meta = getComponentMeta(id)
  if (meta?.implementation === 'planned') {
    return <PlannedPortPlaceholder meta={meta} />
  }
  const Comp = LIVE_RENDERERS[id]
  if (!Comp) {
    return (
      <p className="text-body-sm text-secondary">No renderer registered for {id}.</p>
    )
  }
  return <Comp {...props} />
}

export function getRenderer(id: ComponentId) {
  return LIVE_RENDERERS[id]
}
