export type CommandIntent = 'tool' | 'lifeUpdate'

const LIFE_UPDATE_PHRASES = [
  'i started',
  'i just started',
  "i'm starting",
  'im starting',
  'i am starting',
  'i got',
  'i just got',
  'i finished',
  'i just finished',
  'i completed',
  'i dropped',
  'i quit',
  'i left',
  'i moved',
  "i'm moving",
  'im moving',
  'i am moving',
  'new project',
  'new job',
  'new semester',
  'new role',
  'new course',
  'semester started',
  'semester ended',
  'started a new semester',
  'starting a new semester',
  'got promoted',
  'got hired',
  'got fired',
  'we broke up',
  'started dating',
  'fall semester',
  'spring semester',
]

/** Fast-path life-update detection (ported from Ember IntentRouter) */
export function classifyIntent(command: string): CommandIntent {
  const lower = command.toLowerCase().trim()

  if (LIFE_UPDATE_PHRASES.some((p) => lower.includes(p))) {
    return 'lifeUpdate'
  }

  return 'tool'
}
