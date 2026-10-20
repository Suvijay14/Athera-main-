import { redirect } from 'next/navigation'

/** Canonical overview is the authenticated home dashboard. */
export default function WorkspaceOverviewPage() {
  redirect('/')
}
