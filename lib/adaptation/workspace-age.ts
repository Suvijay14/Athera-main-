import { differenceInDays, parseISO } from 'date-fns'

/** Spec Task 19: lowered suggestion thresholds during the first 7 days after workspace creation. */
export const FIRST_WEEK_DAYS = 7

export function isWorkspaceInFirstWeek(workspaceCreatedAt: string, now: Date): boolean {
  const created = parseISO(workspaceCreatedAt)
  if (Number.isNaN(created.getTime())) {
    return false
  }
  return differenceInDays(now, created) < FIRST_WEEK_DAYS
}
