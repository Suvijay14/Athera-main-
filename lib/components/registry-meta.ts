import { PLANNED_COMPONENT_CATALOG } from './planned-catalog'
import type { ComponentDefinitionMeta, ComponentId } from './types'

const LIVE_COMPONENTS: ComponentDefinitionMeta[] = [
  {
    id: 'native-compact-assistant',
    title: 'Compact assistant',
    description: 'Voice/text assistant card for the active space.',
    category: 'native',
    surfaces: ['lab', 'dashboard'],
    implementation: 'live',
    defaultLayout: { colSpan: 1, minHeight: 200 },
  },
  {
    id: 'native-atheras-note',
    title: "Athera's note",
    description: 'Space-scoped note surface from the overview.',
    category: 'native',
    surfaces: ['lab', 'dashboard'],
    implementation: 'live',
    defaultLayout: { colSpan: 1, minHeight: 200 },
  },
  {
    id: 'native-upcoming-events',
    title: 'Upcoming events',
    description: 'Calendar events for today and upcoming.',
    category: 'native',
    surfaces: ['lab', 'dashboard'],
    implementation: 'live',
    defaultLayout: { colSpan: 1, minHeight: 240 },
  },
  {
    id: 'native-space-summary',
    title: 'Space summary grid',
    description: 'Task counts across core and custom spaces.',
    category: 'native',
    surfaces: ['lab', 'dashboard'],
    implementation: 'live',
    defaultLayout: { colSpan: 2, minHeight: 180 },
  },
  {
    id: 'native-bcourses',
    title: 'bCourses (School)',
    description: 'Canvas assignments widget for the school space.',
    category: 'native',
    surfaces: ['lab', 'dashboard'],
    implementation: 'live',
    defaultLayout: { colSpan: 2, minHeight: 320 },
  },
  {
    id: 'ctc-ui-kit-demo',
    title: 'CTC UI kit demo',
    description: 'Button and badge primitives ported from Cut the Chaos.',
    category: 'ui',
    surfaces: ['lab', 'dashboard'],
    implementation: 'live',
    portWave: 'W1',
    ctcOriginPath: 'components/ui/Button.tsx, Badge.tsx',
    defaultLayout: { colSpan: 1, minHeight: 160 },
  },
  {
    id: 'ctc-empty-state-demo',
    title: 'CTC empty state',
    description: 'Empty state pattern with primary action.',
    category: 'ui',
    surfaces: ['lab', 'dashboard'],
    implementation: 'live',
    portWave: 'W1',
    ctcOriginPath: 'components/ui/EmptyState.tsx',
    defaultLayout: { colSpan: 1, minHeight: 280 },
  },
  {
    id: 'ctc-toast-demo',
    title: 'CTC toast',
    description: 'Toast notification stack demo.',
    category: 'ui',
    surfaces: ['lab', 'dashboard'],
    implementation: 'live',
    portWave: 'W1',
    ctcOriginPath: 'components/ui/Toast.tsx',
    defaultLayout: { colSpan: 1, minHeight: 120 },
  },
  {
    id: 'ctc-command-palette-page',
    title: 'Command palette',
    description: '⌘K jump menu for Athera routes (CTC port, lab scope).',
    category: 'tools',
    surfaces: ['lab', 'page'],
    implementation: 'live',
    portWave: 'W4',
    pagePath: '/components/ctc-command-palette-page',
    sidebarIcon: 'search',
    ctcOriginPath: 'components/search/CommandPalette.tsx',
  },
  {
    id: 'ctc-ui-page-transition',
    title: 'CTC PageTransition',
    description: 'Fade-in content transition (CTC FadeIn).',
    category: 'ui',
    surfaces: ['lab'],
    implementation: 'live',
    portWave: 'W1',
    ctcOriginPath: 'components/ui/PageTransition.tsx',
    defaultLayout: { colSpan: 1, minHeight: 160 },
  },
  {
    id: 'ctc-tasks-new-modal',
    title: 'CTC New task modal',
    description: 'Create-task dialog wired to Athera tasks API.',
    category: 'tasks',
    surfaces: ['lab', 'dashboard'],
    implementation: 'live',
    portWave: 'W2',
    ctcOriginPath: 'components/tasks/NewTaskModal.tsx',
    defaultLayout: { colSpan: 1, minHeight: 120 },
  },
  {
    id: 'ctc-tasks-swipe-row',
    title: 'CTC Swipeable task row',
    description: 'Swipe left for archive / delete on demo tasks.',
    category: 'tasks',
    surfaces: ['lab', 'dashboard'],
    implementation: 'live',
    portWave: 'W2',
    ctcOriginPath: 'components/tasks/SwipeableTaskRow.tsx',
    defaultLayout: { colSpan: 1, minHeight: 200 },
  },
  {
    id: 'ctc-smart-note-input',
    title: 'CTC Smart note input',
    description: 'Notes with @workspace chips; saves to localStorage in lab.',
    category: 'notes',
    surfaces: ['lab', 'dashboard'],
    implementation: 'live',
    portWave: 'W3',
    ctcOriginPath: 'components/ui/SmartNoteInput.tsx',
    defaultLayout: { colSpan: 1, minHeight: 220 },
  },
  {
    id: 'ctc-command-palette',
    title: 'CTC Command palette (alias)',
    description: 'Same ⌘K palette as command palette page — for catalog parity.',
    category: 'tools',
    surfaces: ['lab', 'page'],
    implementation: 'live',
    portWave: 'W4',
    pagePath: '/components/ctc-command-palette',
    sidebarIcon: 'search',
    ctcOriginPath: 'components/search/CommandPalette.tsx',
  },
  {
    id: 'ctc-doc-library',
    title: 'CTC Document library',
    description: 'Shows roster rows from Import card (lab storage).',
    category: 'documents',
    surfaces: ['lab', 'page'],
    implementation: 'live',
    portWave: 'W5',
    pagePath: '/components/ctc-doc-library',
    sidebarIcon: 'folder',
    ctcOriginPath: 'components/documents/DocumentLibrary.tsx',
    defaultLayout: { colSpan: 2, minHeight: 240 },
  },
  {
    id: 'ctc-doc-import-card',
    title: 'CTC Import card',
    description: 'CSV roster import with column mapping and preview.',
    category: 'documents',
    surfaces: ['lab', 'page'],
    implementation: 'live',
    portWave: 'W5',
    pagePath: '/components/ctc-doc-import-card',
    sidebarIcon: 'upload',
    ctcOriginPath: 'components/documents/ImportCard.tsx',
    defaultLayout: { colSpan: 2, minHeight: 320 },
  },
  {
    id: 'ctc-doc-brief-import',
    title: 'CTC Brief / syllabus extract',
    description: 'Upload .txt/.md → suggested tasks; optional push to task API.',
    category: 'documents',
    surfaces: ['lab', 'page'],
    implementation: 'live',
    portWave: 'W5',
    pagePath: '/components/ctc-doc-brief-import',
    ctcOriginPath: 'components/documents/ImportEventBriefButton.tsx',
    defaultLayout: { colSpan: 2, minHeight: 280 },
  },
]

export const COMPONENT_REGISTRY: ComponentDefinitionMeta[] = [
  ...LIVE_COMPONENTS,
  ...PLANNED_COMPONENT_CATALOG,
]

export const DEFAULT_DASHBOARD_WIDGET_IDS: ComponentId[] = [
  'native-upcoming-events',
  'native-compact-assistant',
  'native-atheras-note',
  'native-space-summary',
]

export function getComponentMeta(id: string): ComponentDefinitionMeta | undefined {
  return COMPONENT_REGISTRY.find((c) => c.id === id)
}

export function isComponentId(id: string): id is ComponentId {
  return COMPONENT_REGISTRY.some((c) => c.id === id)
}

export function isLiveComponent(id: string): boolean {
  return getComponentMeta(id)?.implementation === 'live'
}

export function catalogRowsForSync() {
  return COMPONENT_REGISTRY.map((c, index) => ({
    id: c.id,
    title: c.title,
    category: c.category,
    surfaces: c.surfaces,
    sort_order: index,
    updated_at: new Date().toISOString(),
  }))
}
