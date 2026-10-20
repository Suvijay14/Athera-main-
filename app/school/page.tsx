import { redirect } from 'next/navigation'

/** Legacy UI #1 route — workspace lives at `/` and `/workspace/spaces/*`. */
export default function LegacySchoolRedirect() {
  redirect('/')
}
