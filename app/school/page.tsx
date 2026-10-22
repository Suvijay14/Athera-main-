import { redirect } from 'next/navigation'

import { PRODUCT_ENTRY_PATH } from '@/lib/routes/product-entry'

/** Legacy UI #1 route — workspace lives at `/workspace` and `/workspace/spaces/*`. */
export default function LegacySchoolRedirect() {
  redirect(PRODUCT_ENTRY_PATH)
}
