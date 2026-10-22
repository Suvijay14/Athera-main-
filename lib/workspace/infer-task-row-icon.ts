/** Heuristic icon kind for space list rows (mockup-style), from title text only. */
export type TaskRowIconKind = 'call' | 'deliverable' | 'task'

const CALL = /\b(call|phone|meet(ing)?|sync|kickoff|review w\/|site review)\b/i
const DELIVERABLE = /\b(send|invoice|mockup|logo|concepts|deliver|draft|quote|proposal|plan)\b/i

export function inferTaskRowIconKind(title: string): TaskRowIconKind {
  const t = title.trim()
  if (!t) {
    return 'task'
  }
  if (CALL.test(t)) {
    return 'call'
  }
  if (DELIVERABLE.test(t)) {
    return 'deliverable'
  }
  return 'task'
}
