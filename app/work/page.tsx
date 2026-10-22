import { redirect } from 'next/navigation'

import { PRODUCT_ENTRY_PATH } from '@/lib/routes/product-entry'

export default function LegacyWorkRedirect() {
  redirect(PRODUCT_ENTRY_PATH)
}
