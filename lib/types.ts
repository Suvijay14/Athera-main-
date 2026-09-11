export interface Task {
  id: string
  title: string
  completed: boolean
  source: 'canvas' | 'gmail' | 'manual' | 'notebook'
  dueDate?: string
  detail?: string
  urgency: 'high' | 'medium' | 'low' | 'none'
}

export interface CalendarEvent {
  id: string
  title: string
  startTime: string
  endTime: string
  location?: string
  type: 'class' | 'focus' | 'deadline' | 'meeting' | 'other'
  status?: 'attended' | 'up-next' | 'reserved' | 'scheduled' | 'final-due'
}

export interface PendingFileItem {
  name: string
  path: string
  type: 'file' | 'directory'
}

export interface PendingApproval {
  id: string
  label: string
  sourcePath: string
  files: PendingFileItem[]
}

export interface SpaceEmailMeta {
  messageId: string
  threadId?: string
  from: string
  subject: string
  snippet: string
  date: string
  gmailUrl: string
}

export interface SpaceFile {
  name: string
  path: string
  isDirectory?: boolean
  source: string
  email?: SpaceEmailMeta
}

export interface EmailFilingSuggestion {
  messageId: string
  from: string
  subject: string
  snippet: string
  date: string
  spaceSlug: string
  spaceName: string
  confidence: number
  reason: string
}

export interface PendingEmailFiling {
  id: string
  scannedDays: number
  suggestions: EmailFilingSuggestion[]
  userMessage: string
}

export interface Space {
  id: string
  slug: string
  name: string
  source: string
  files: SpaceFile[]
  createdAt: string
  updatedAt: string
}

/** Port of Ember AthenaReasoning result — pending user confirmation */
export interface PendingLifeAction {
  signal: string
  kind: string
  certainty: number
  modality: string
  facts: string[]
  shouldAdapt: boolean
  actionType: string
  actionTarget: string
  lifeNote: string
  userMessage: string
  scanPaths?: string[]
}
